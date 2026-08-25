// Tester coverage for US-028 (competency_chat_messages) — any authenticated
// user can read/write regardless of profile membership, message-body
// validation (same limits as DM/task_comments), and the 404-for-retired-
// or-missing-room gate that deliberately does NOT delete history. Lives
// under test/concurrency/ for the same reason as taskComments.test.js/
// dmThreads.test.js — needs the real Postgres connection the concurrency
// harness sets up.
const { db, createUser, cleanupUser } = require('./helpers');
const competencyChatService = require('../../src/services/competencyChat.service');
const { ValidationError, NotFoundError } = require('../../src/lib/serviceErrors');

describe('US-028 competency group chat', () => {
  let userId;
  let competency;

  beforeEach(async () => {
    userId = await createUser();
    competency = await db('competencies').where({ is_active: true }).first();
  });

  afterEach(async () => {
    await cleanupUser(userId);
  });

  it('AC2/AC3: any authenticated user can post and read, regardless of whether the competency is in their own profile', async () => {
    // Deliberately no user_competencies row for `userId` at all.
    const posted = await competencyChatService.createMessage(competency.id, userId, { body: '  Hello room  ' });
    expect(posted.body).toBe('Hello room'); // trimmed
    expect(posted.competencyId).toBe(competency.id);
    expect(posted.senderId).toBe(userId);
    expect(posted.senderName).toBeTruthy();

    const messages = await competencyChatService.listMessages(competency.id);
    expect(messages.map((m) => m.body)).toContain('Hello room');
  });

  it('AC2: messages are returned chronologically, oldest first', async () => {
    await competencyChatService.createMessage(competency.id, userId, { body: 'First' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const otherId = await createUser();
    await competencyChatService.createMessage(competency.id, otherId, { body: 'Second' });

    const messages = await competencyChatService.listMessages(competency.id);
    const ordered = messages.filter((m) => ['First', 'Second'].includes(m.body));
    expect(ordered.map((m) => m.body)).toEqual(['First', 'Second']);

    await cleanupUser(otherId);
  });

  it('AC4: empty/whitespace-only body is 400 errors.competencyChat.messageBodyRequired', async () => {
    await expect(competencyChatService.createMessage(competency.id, userId, { body: '' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(competencyChatService.createMessage(competency.id, userId, { body: '   ' })).rejects.toMatchObject({
      messageKey: 'errors.competencyChat.messageBodyRequired',
    });
    await expect(competencyChatService.createMessage(competency.id, userId, {})).rejects.toMatchObject({
      messageKey: 'errors.competencyChat.messageBodyRequired',
    });
  });

  it('AC4: a body over 2000 characters is 400 errors.competencyChat.messageBodyTooLong; exactly 2000 is accepted', async () => {
    const tooLong = 'a'.repeat(2001);
    await expect(
      competencyChatService.createMessage(competency.id, userId, { body: tooLong }),
    ).rejects.toMatchObject({ messageKey: 'errors.competencyChat.messageBodyTooLong' });

    const exactly2000 = 'a'.repeat(2000);
    const ok = await competencyChatService.createMessage(competency.id, userId, { body: exactly2000 });
    expect(ok.body).toHaveLength(2000);
  });

  it('AC5: a nonexistent competencyId 404s on both GET and POST (errors.competencyChat.notFound)', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await expect(competencyChatService.listMessages(fakeId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(competencyChatService.listMessages(fakeId)).rejects.toMatchObject({
      messageKey: 'errors.competencyChat.notFound',
    });
    await expect(competencyChatService.createMessage(fakeId, userId, { body: 'Nope' })).rejects.toMatchObject({
      messageKey: 'errors.competencyChat.notFound',
    });
  });

  it('AC5: a retired (is_active=false) competency 404s the chat but does NOT delete existing history', async () => {
    const [retired] = await db('competencies').insert({ slug: `retired-${Date.now()}`, is_active: true }).returning('*');
    const posted = await competencyChatService.createMessage(retired.id, userId, { body: 'Before retirement' });

    await db('competencies').where({ id: retired.id }).update({ is_active: false });

    await expect(competencyChatService.listMessages(retired.id)).rejects.toMatchObject({
      messageKey: 'errors.competencyChat.notFound',
    });
    await expect(competencyChatService.createMessage(retired.id, userId, { body: 'After retirement' })).rejects.toMatchObject(
      { messageKey: 'errors.competencyChat.notFound' },
    );

    // History still in the DB, untouched — the product path is closed, the
    // row is not deleted (US-028 AC5's explicit "не видаляє історію").
    const row = await db('competency_chat_messages').where({ id: posted.id }).first();
    expect(row).toBeDefined();
    expect(row.body).toBe('Before retirement');

    await db('competencies').where({ id: retired.id }).delete();
  });

  it('AC6: concurrent posts from multiple users all land without loss', async () => {
    const userIds = await Promise.all([createUser(), createUser(), createUser()]);
    await Promise.all(
      userIds.map((id, i) => competencyChatService.createMessage(competency.id, id, { body: `Concurrent ${i}` })),
    );
    const messages = await competencyChatService.listMessages(competency.id);
    for (let i = 0; i < userIds.length; i += 1) {
      expect(messages.some((m) => m.body === `Concurrent ${i}`)).toBe(true);
    }
    await Promise.all(userIds.map((id) => cleanupUser(id)));
  });
});
