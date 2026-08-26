// Tester coverage for US-031 (competency_chat_members) — persistent
// join/leave, kept separate from competencyChat.test.js (US-028's
// messages-only coverage) since this file exercises a different table and
// a different set of ACs. Lives under test/concurrency/ for the same
// reason as competencyChat.test.js — needs the real Postgres connection
// the concurrency harness sets up, and this table's unique constraint is
// exactly the kind of DB-level invariant that harness is for.
const { db, createUser, cleanupUser } = require('./helpers');
const competencyChatService = require('../../src/services/competencyChat.service');
const { NotFoundError } = require('../../src/lib/serviceErrors');

describe('US-031 competency chat membership (join/leave)', () => {
  let userId;
  let competency;

  beforeEach(async () => {
    userId = await createUser();
    competency = await db('competencies').where({ is_active: true }).first();
  });

  afterEach(async () => {
    await db('competency_chat_members').where({ user_id: userId }).delete();
    await cleanupUser(userId);
  });

  it('AC1: joining creates a membership row and is idempotent on repeat calls (no duplicate)', async () => {
    const first = await competencyChatService.joinChat(competency.id, userId);
    expect(first.created).toBe(true);

    const second = await competencyChatService.joinChat(competency.id, userId);
    expect(second.created).toBe(false);

    const rows = await db('competency_chat_members').where({ user_id: userId, competency_id: competency.id });
    expect(rows).toHaveLength(1);
  });

  it('AC1/unique constraint: concurrent joins from the same user land as exactly one row', async () => {
    const results = await Promise.all([
      competencyChatService.joinChat(competency.id, userId),
      competencyChatService.joinChat(competency.id, userId),
      competencyChatService.joinChat(competency.id, userId),
    ]);
    expect(results.filter((r) => r.created)).toHaveLength(1);

    const rows = await db('competency_chat_members').where({ user_id: userId, competency_id: competency.id });
    expect(rows).toHaveLength(1);
  });

  it('DB-level unique (user_id, competency_id): a raw duplicate insert is rejected even bypassing the service', async () => {
    await competencyChatService.joinChat(competency.id, userId);
    await expect(
      db('competency_chat_members').insert({ user_id: userId, competency_id: competency.id }),
    ).rejects.toThrow(/unique|duplicate/i);
  });

  it('AC2: leaving hard-deletes the row and is idempotent when already not a member', async () => {
    await competencyChatService.joinChat(competency.id, userId);
    await competencyChatService.leaveChat(competency.id, userId);

    const row = await db('competency_chat_members').where({ user_id: userId, competency_id: competency.id }).first();
    expect(row).toBeUndefined();

    // Repeat call, no prior membership — no error, no-op.
    await expect(competencyChatService.leaveChat(competency.id, userId)).resolves.toBeUndefined();
  });

  it('AC2: leaving with no prior membership at all is a no-op, not an error', async () => {
    await expect(competencyChatService.leaveChat(competency.id, userId)).resolves.toBeUndefined();
  });

  it('AC3: joining a nonexistent or retired competency 404s (errors.competencyChat.notFound)', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await expect(competencyChatService.joinChat(fakeId, userId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(competencyChatService.joinChat(fakeId, userId)).rejects.toMatchObject({
      messageKey: 'errors.competencyChat.notFound',
    });

    const [retired] = await db('competencies').insert({ slug: `retired-join-${Date.now()}`, is_active: true }).returning('*');
    await db('competencies').where({ id: retired.id }).update({ is_active: false });
    await expect(competencyChatService.joinChat(retired.id, userId)).rejects.toMatchObject({
      messageKey: 'errors.competencyChat.notFound',
    });

    await db('competencies').where({ id: retired.id }).delete();
  });

  it('AC3: leaving a competency joined earlier and since deactivated is still allowed (clears the archived row)', async () => {
    const [retired] = await db('competencies').insert({ slug: `retired-leave-${Date.now()}`, is_active: true }).returning('*');
    await competencyChatService.joinChat(retired.id, userId);

    await db('competencies').where({ id: retired.id }).update({ is_active: false });

    await expect(competencyChatService.leaveChat(retired.id, userId)).resolves.toBeUndefined();
    const row = await db('competency_chat_members').where({ user_id: userId, competency_id: retired.id }).first();
    expect(row).toBeUndefined();

    await db('competencies').where({ id: retired.id }).delete();
  });

  it('AC4: joining/leaving does not gate read/write access to the chat itself — both work with no membership', async () => {
    // Deliberately never joined.
    const posted = await competencyChatService.createMessage(competency.id, userId, { body: 'No membership needed' });
    expect(posted.body).toBe('No membership needed');
    const messages = await competencyChatService.listMessages(competency.id);
    expect(messages.map((m) => m.body)).toContain('No membership needed');

    const membership = await db('competency_chat_members').where({ user_id: userId, competency_id: competency.id }).first();
    expect(membership).toBeUndefined();
  });

  it('AC5: GET mine returns joined chats sorted by last activity (most recent message, or joinedAt), newest first', async () => {
    const [compA] = await db('competencies').insert({ slug: `mine-a-${Date.now()}`, is_active: true }).returning('*');
    const [compB] = await db('competencies').insert({ slug: `mine-b-${Date.now()}`, is_active: true }).returning('*');

    await competencyChatService.joinChat(compA.id, userId); // no messages yet -> activity = joinedAt
    await new Promise((resolve) => setTimeout(resolve, 10));
    await competencyChatService.joinChat(compB.id, userId);
    await competencyChatService.createMessage(compB.id, userId, { body: 'Hello B' });

    await new Promise((resolve) => setTimeout(resolve, 10));
    // Bump compA's activity above compB's by posting to it last.
    await competencyChatService.createMessage(compA.id, userId, { body: 'Hello A, later' });

    const mine = await competencyChatService.listMyChats(userId);
    const ids = mine.map((c) => c.competencyId);
    expect(ids.indexOf(compA.id)).toBeLessThan(ids.indexOf(compB.id));

    const rowA = mine.find((c) => c.competencyId === compA.id);
    expect(rowA.lastMessage).toMatchObject({ body: 'Hello A, later' });
    expect(rowA.competencySlug).toBe(compA.slug);
    expect(rowA.competencyActive).toBe(true);

    await db('competency_chat_messages').whereIn('competency_id', [compA.id, compB.id]).delete();
    await db('competency_chat_members').whereIn('competency_id', [compA.id, compB.id]).delete();
    await db('competencies').whereIn('id', [compA.id, compB.id]).delete();
  });

  it('AC5: a chat with no messages yet uses joinedAt as its activity time (still listed, lastMessage null)', async () => {
    await competencyChatService.joinChat(competency.id, userId);
    const mine = await competencyChatService.listMyChats(userId);
    const row = mine.find((c) => c.competencyId === competency.id);
    expect(row).toBeDefined();
    expect(row.lastMessage).toBeNull();
    expect(row.joinedAt).toBeTruthy();
  });

  it('AC7/US-033 AC5: a competency deactivated after joining stays in the list with competencyActive=false, not deleted', async () => {
    const [retired] = await db('competencies').insert({ slug: `retired-mine-${Date.now()}`, is_active: true }).returning('*');
    await competencyChatService.joinChat(retired.id, userId);
    await db('competencies').where({ id: retired.id }).update({ is_active: false });

    const mine = await competencyChatService.listMyChats(userId);
    const row = mine.find((c) => c.competencyId === retired.id);
    expect(row).toBeDefined();
    expect(row.competencyActive).toBe(false);

    await db('competency_chat_members').where({ competency_id: retired.id }).delete();
    await db('competencies').where({ id: retired.id }).delete();
  });

  it('AC6: no auto-join from user_competencies — having the competency in my profile does not create membership', async () => {
    await db('user_competencies').insert({
      user_id: userId,
      competency_id: competency.id,
      is_custom: false,
      willing_to_teach: false,
    });

    const membership = await db('competency_chat_members').where({ user_id: userId, competency_id: competency.id }).first();
    expect(membership).toBeUndefined();

    const mine = await competencyChatService.listMyChats(userId);
    expect(mine.find((c) => c.competencyId === competency.id)).toBeUndefined();

    await db('user_competencies').where({ user_id: userId, competency_id: competency.id }).delete();
  });
});
