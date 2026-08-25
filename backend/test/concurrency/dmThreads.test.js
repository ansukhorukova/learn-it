// Tester coverage for US-027 (dm_threads/dm_messages) — get-or-create
// idempotency, the normalized-pair unique constraint, self-message/
// competency-offer validation, absolute two-participant privacy, and
// message-body validation. Lives under test/concurrency/ for the same
// reason as taskComments.test.js: vitest.config.js only includes that glob,
// and this suite needs the real Postgres connection the concurrency
// harness already sets up (see globalSetup.js/env.js) — the unique
// constraint / onConflict race case genuinely does need real Postgres, even
// though most other cases here are plain authorization/validation checks.
const { db, createUser, cleanupUser } = require('./helpers');
const dmThreadsService = require('../../src/services/dmThreads.service');
const { ValidationError, ForbiddenError } = require('../../src/lib/serviceErrors');

async function getCompetency() {
  return db('competencies').where({ is_active: true }).first();
}

async function setWillingToTeach(userId, competencyId, willing = true) {
  await db('user_competencies')
    .insert({ user_id: userId, competency_id: competencyId, is_custom: false, willing_to_teach: willing })
    .onConflict(['user_id', 'competency_id'])
    .merge({ willing_to_teach: willing });
}

describe('US-027 DM threads', () => {
  let callerId;
  let targetId;
  let competency;

  beforeEach(async () => {
    callerId = await createUser();
    targetId = await createUser();
    competency = await getCompetency();
    await setWillingToTeach(targetId, competency.id, true);
  });

  afterEach(async () => {
    await cleanupUser(callerId);
    await cleanupUser(targetId);
  });

  it('AC1: get-or-create is idempotent — repeated calls return the same thread id, first is created:true, second created:false', async () => {
    const first = await dmThreadsService.getOrCreateThread(callerId, {
      targetUserId: targetId,
      competencyId: competency.id,
    });
    expect(first.created).toBe(true);
    expect(first.thread.competencyId).toBe(competency.id);
    expect(first.thread.otherUser.id).toBe(targetId);

    const second = await dmThreadsService.getOrCreateThread(callerId, {
      targetUserId: targetId,
      competencyId: competency.id,
    });
    expect(second.created).toBe(false);
    expect(second.thread.id).toBe(first.thread.id);

    const rows = await db('dm_threads').where({ competency_id: competency.id });
    expect(rows).toHaveLength(1);
  });

  it('AC1: the same pair+competency normalizes regardless of who initiates — target messaging caller first, then caller messaging target, resolve to one row', async () => {
    // Target must also be able to message caller under some competency the
    // CALLER offers, to exercise "either direction normalizes the same" —
    // reuse the same competency by also marking the caller willing to
    // teach it, purely for this direction-independence check.
    await setWillingToTeach(callerId, competency.id, true);

    const fromTarget = await dmThreadsService.getOrCreateThread(targetId, {
      targetUserId: callerId,
      competencyId: competency.id,
    });
    const fromCaller = await dmThreadsService.getOrCreateThread(callerId, {
      targetUserId: targetId,
      competencyId: competency.id,
    });

    expect(fromCaller.thread.id).toBe(fromTarget.thread.id);
    const rows = await db('dm_threads').where({ competency_id: competency.id });
    expect(rows).toHaveLength(1);
    // Normalized storage: user_a_id is always the lexicographically smaller id.
    expect(rows[0].user_a_id < rows[0].user_b_id).toBe(true);
  });

  it('unique constraint backstop: concurrent get-or-create calls for the same pair+competency never produce two rows', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        dmThreadsService.getOrCreateThread(callerId, { targetUserId: targetId, competencyId: competency.id }),
      ),
    );
    const ids = new Set(results.map((r) => r.thread.id));
    expect(ids.size).toBe(1);
    expect(results.filter((r) => r.created).length).toBe(1);

    const rows = await db('dm_threads').where({ competency_id: competency.id });
    expect(rows).toHaveLength(1);
  });

  it('AC2: targetUserId equal to caller is 400 errors.dmThread.cannotMessageSelf, no thread created', async () => {
    await expect(
      dmThreadsService.getOrCreateThread(callerId, { targetUserId: callerId, competencyId: competency.id }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      dmThreadsService.getOrCreateThread(callerId, { targetUserId: callerId, competencyId: competency.id }),
    ).rejects.toMatchObject({ messageKey: 'errors.dmThread.cannotMessageSelf' });

    const rows = await db('dm_threads').where({ user_a_id: callerId, user_b_id: callerId });
    expect(rows).toHaveLength(0);
  });

  it('AC3: a competencyId the target has NOT marked willing_to_teach=true is 400 errors.dmThread.competencyNotOffered (direct-API bypass case)', async () => {
    const otherCompetency = await db('competencies').where({ is_active: true }).andWhereNot({ id: competency.id }).first();
    // otherCompetency is not marked willing_to_teach for targetId at all.
    await expect(
      dmThreadsService.getOrCreateThread(callerId, { targetUserId: targetId, competencyId: otherCompetency.id }),
    ).rejects.toMatchObject({ messageKey: 'errors.dmThread.competencyNotOffered' });

    // Also covers: target HAS the competency but willing_to_teach=false.
    await db('user_competencies')
      .insert({ user_id: targetId, competency_id: otherCompetency.id, is_custom: false, willing_to_teach: false })
      .onConflict(['user_id', 'competency_id'])
      .merge({ willing_to_teach: false });
    await expect(
      dmThreadsService.getOrCreateThread(callerId, { targetUserId: targetId, competencyId: otherCompetency.id }),
    ).rejects.toMatchObject({ messageKey: 'errors.dmThread.competencyNotOffered' });

    const rows = await db('dm_threads').where({ competency_id: otherCompetency.id });
    expect(rows).toHaveLength(0);
  });

  it('a nonexistent/malformed competencyId is also 400 errors.dmThread.competencyNotOffered, not a 500', async () => {
    await expect(
      dmThreadsService.getOrCreateThread(callerId, { targetUserId: targetId, competencyId: 'not-a-uuid' }),
    ).rejects.toMatchObject({ messageKey: 'errors.dmThread.competencyNotOffered' });
  });

  it('AC5: a caller who is NOT a participant gets 403 errors.dmThread.forbidden on both GET and POST messages', async () => {
    const { thread } = await dmThreadsService.getOrCreateThread(callerId, {
      targetUserId: targetId,
      competencyId: competency.id,
    });
    const strangerId = await createUser();

    await expect(dmThreadsService.listMessages(thread.id, strangerId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(dmThreadsService.listMessages(thread.id, strangerId)).rejects.toMatchObject({
      messageKey: 'errors.dmThread.forbidden',
    });
    await expect(dmThreadsService.createMessage(thread.id, strangerId, { body: 'Nope' })).rejects.toMatchObject({
      messageKey: 'errors.dmThread.forbidden',
    });

    const rows = await db('dm_messages').where({ thread_id: thread.id });
    expect(rows).toHaveLength(0);

    await cleanupUser(strangerId);
  });

  it('a nonexistent thread id is ALSO 403 errors.dmThread.forbidden, never a distinct 404 (anti-enumeration, US-029 AC4)', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await expect(dmThreadsService.listMessages(fakeId, callerId)).rejects.toMatchObject({
      messageKey: 'errors.dmThread.forbidden',
    });
    await expect(dmThreadsService.createMessage(fakeId, callerId, { body: 'Nope' })).rejects.toMatchObject({
      messageKey: 'errors.dmThread.forbidden',
    });
  });

  it('AC4/AC6/AC11: both participants can read/write, messages are chronological, and both directions see the same thread in listThreads', async () => {
    const { thread } = await dmThreadsService.getOrCreateThread(callerId, {
      targetUserId: targetId,
      competencyId: competency.id,
    });

    const first = await dmThreadsService.createMessage(thread.id, callerId, { body: '  Hi there  ' });
    expect(first.body).toBe('Hi there'); // trimmed
    expect(first.senderId).toBe(callerId);

    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = await dmThreadsService.createMessage(thread.id, targetId, { body: 'Hello!' });

    const asCaller = await dmThreadsService.listMessages(thread.id, callerId);
    const asTarget = await dmThreadsService.listMessages(thread.id, targetId);
    expect(asCaller.map((m) => m.body)).toEqual(['Hi there', 'Hello!']);
    expect(asTarget.map((m) => m.body)).toEqual(['Hi there', 'Hello!']);

    const callerThreads = await dmThreadsService.listThreads(callerId);
    const targetThreads = await dmThreadsService.listThreads(targetId);
    expect(callerThreads.find((t) => t.id === thread.id)).toBeDefined();
    expect(targetThreads.find((t) => t.id === thread.id)).toBeDefined();
    expect(callerThreads.find((t) => t.id === thread.id).lastMessage.body).toBe(second.body);
    // Each side sees the OTHER participant as `otherUser`, never themselves.
    expect(callerThreads.find((t) => t.id === thread.id).otherUser.id).toBe(targetId);
    expect(targetThreads.find((t) => t.id === thread.id).otherUser.id).toBe(callerId);
  });

  it('AC12: a freshly-created thread with no messages yet appears in listThreads with a null lastMessage', async () => {
    const { thread } = await dmThreadsService.getOrCreateThread(callerId, {
      targetUserId: targetId,
      competencyId: competency.id,
    });
    const threads = await dmThreadsService.listThreads(callerId);
    const found = threads.find((t) => t.id === thread.id);
    expect(found).toBeDefined();
    expect(found.lastMessage).toBeNull();
  });

  it('AC7: empty/whitespace-only body is 400 errors.dmThread.messageBodyRequired', async () => {
    const { thread } = await dmThreadsService.getOrCreateThread(callerId, {
      targetUserId: targetId,
      competencyId: competency.id,
    });
    await expect(dmThreadsService.createMessage(thread.id, callerId, { body: '   ' })).rejects.toMatchObject({
      messageKey: 'errors.dmThread.messageBodyRequired',
    });
    await expect(dmThreadsService.createMessage(thread.id, callerId, {})).rejects.toMatchObject({
      messageKey: 'errors.dmThread.messageBodyRequired',
    });
  });

  it('AC7: a body over 2000 characters is 400 errors.dmThread.messageBodyTooLong; exactly 2000 is accepted', async () => {
    const { thread } = await dmThreadsService.getOrCreateThread(callerId, {
      targetUserId: targetId,
      competencyId: competency.id,
    });
    const tooLong = 'a'.repeat(2001);
    await expect(dmThreadsService.createMessage(thread.id, callerId, { body: tooLong })).rejects.toMatchObject({
      messageKey: 'errors.dmThread.messageBodyTooLong',
    });

    const exactly2000 = 'a'.repeat(2000);
    const ok = await dmThreadsService.createMessage(thread.id, callerId, { body: exactly2000 });
    expect(ok.body).toHaveLength(2000);
  });

  it('two different competencies for the same pair are two independent threads with independent history', async () => {
    const otherCompetency = await db('competencies').where({ is_active: true }).andWhereNot({ id: competency.id }).first();
    await setWillingToTeach(targetId, otherCompetency.id, true);

    const threadA = await dmThreadsService.getOrCreateThread(callerId, {
      targetUserId: targetId,
      competencyId: competency.id,
    });
    const threadB = await dmThreadsService.getOrCreateThread(callerId, {
      targetUserId: targetId,
      competencyId: otherCompetency.id,
    });
    expect(threadA.thread.id).not.toBe(threadB.thread.id);

    await dmThreadsService.createMessage(threadA.thread.id, callerId, { body: 'About A' });
    const messagesB = await dmThreadsService.listMessages(threadB.thread.id, callerId);
    expect(messagesB).toHaveLength(0);
  });
});
