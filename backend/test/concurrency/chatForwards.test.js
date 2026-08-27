// Tester coverage for US-036 (forward messages, forbidden from DM) — the
// core source-table-lookup rule (AC1-3), destination authorization reuse
// (AC4/AC5), the transitive DM-forbidden rule (AC7), and the forward
// attribution shape. Lives under test/concurrency/ for the same reason as
// dmThreads.test.js/competencyChat.test.js — needs the real Postgres
// connection the concurrency harness sets up.
const { db, createUser, cleanupUser } = require('./helpers');
const dmThreadsService = require('../../src/services/dmThreads.service');
const competencyChatService = require('../../src/services/competencyChat.service');
const chatForwardsService = require('../../src/services/chatForwards.service');
const { ForbiddenError, NotFoundError } = require('../../src/lib/serviceErrors');

async function makeCompetency(prefix) {
  const [row] = await db('competencies')
    .insert({ slug: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`, is_active: true })
    .returning('*');
  return row;
}

async function setWillingToTeach(userId, competencyId, willing = true) {
  await db('user_competencies')
    .insert({ user_id: userId, competency_id: competencyId, is_custom: false, willing_to_teach: willing })
    .onConflict(['user_id', 'competency_id'])
    .merge({ willing_to_teach: willing });
}

describe('US-036 chat forwards', () => {
  let forwarderId;
  let otherId;
  let strangerId;
  let sourceCompetency;
  let destCompetency;

  beforeEach(async () => {
    forwarderId = await createUser();
    otherId = await createUser();
    strangerId = await createUser();
    sourceCompetency = await makeCompetency('fwd-source');
    destCompetency = await makeCompetency('fwd-dest');
  });

  afterEach(async () => {
    await cleanupUser(forwarderId);
    await cleanupUser(otherId);
    await cleanupUser(strangerId);
    await db('competencies').whereIn('id', [sourceCompetency.id, destCompetency.id]).delete();
  });

  it('AC1/AC6: forwarding a competency-chat message into a DM thread succeeds, sender is the forwarder, and carries the attribution', async () => {
    const originalMessage = await competencyChatService.createMessage(sourceCompetency.id, otherId, {
      body: 'Useful info in the room',
    });

    await setWillingToTeach(otherId, destCompetency.id, true);
    const { thread } = await dmThreadsService.getOrCreateThread(forwarderId, {
      targetUserId: otherId,
      competencyId: destCompetency.id,
    });

    const forwarded = await chatForwardsService.createForward(forwarderId, {
      sourceMessageId: originalMessage.id,
      destinationType: 'dmThread',
      destinationId: thread.id,
    });

    expect(forwarded.senderId).toBe(forwarderId); // forwarder, NOT original author
    expect(forwarded.body).toBe('Useful info in the room');
    expect(forwarded.threadId).toBe(thread.id);
    expect(forwarded.forwardedFrom).toMatchObject({
      competencyId: sourceCompetency.id,
      competencySlug: sourceCompetency.slug,
    });

    const row = await db('dm_messages').where({ id: forwarded.id }).first();
    expect(row.sender_id).toBe(forwarderId);
    expect(row.forwarded_from_competency_id).toBe(sourceCompetency.id);
  });

  it('AC1/AC5: forwarding a competency-chat message into ANOTHER competency chat succeeds even without membership in either room', async () => {
    const originalMessage = await competencyChatService.createMessage(sourceCompetency.id, otherId, {
      body: 'Cross-room forward',
    });

    // forwarderId has joined neither sourceCompetency nor destCompetency.
    const forwarded = await chatForwardsService.createForward(forwarderId, {
      sourceMessageId: originalMessage.id,
      destinationType: 'competencyChat',
      destinationId: destCompetency.id,
    });

    expect(forwarded.senderId).toBe(forwarderId);
    expect(forwarded.competencyId).toBe(destCompetency.id);
    expect(forwarded.forwardedFrom).toMatchObject({ competencyId: sourceCompetency.id });

    const inRoom = await competencyChatService.listMessages(destCompetency.id);
    expect(inRoom.find((m) => m.id === forwarded.id)).toBeDefined();
  });

  it('AC6: a forward into a competency room carries the source competency slug in forwardedFrom', async () => {
    const originalMessage = await competencyChatService.createMessage(sourceCompetency.id, otherId, {
      body: 'Attribution check',
    });

    const forwarded = await chatForwardsService.createForward(forwarderId, {
      sourceMessageId: originalMessage.id,
      destinationType: 'competencyChat',
      destinationId: destCompetency.id,
    });

    expect(forwarded.forwardedFrom).toMatchObject({
      competencyId: sourceCompetency.id,
      competencySlug: sourceCompetency.slug,
    });

    // And the same attribution survives a re-fetch of the destination room history.
    const history = await competencyChatService.listMessages(destCompetency.id);
    const found = history.find((m) => m.id === forwarded.id);
    expect(found.forwardedFrom).toMatchObject({ competencySlug: sourceCompetency.slug });
  });

  it('AC11: a forwarded body is copied verbatim, never re-validated (a 2000-char original forwards fine)', async () => {
    const maxBody = 'y'.repeat(2000);
    const originalMessage = await competencyChatService.createMessage(sourceCompetency.id, otherId, { body: maxBody });

    const forwarded = await chatForwardsService.createForward(forwarderId, {
      sourceMessageId: originalMessage.id,
      destinationType: 'competencyChat',
      destinationId: destCompetency.id,
    });
    expect(forwarded.body).toBe(maxBody);
  });

  it('AC2: forwarding a DM message is 403 errors.chat.forwardFromDmForbidden, even for a participant of that exact thread', async () => {
    await setWillingToTeach(otherId, sourceCompetency.id, true);
    const { thread } = await dmThreadsService.getOrCreateThread(forwarderId, {
      targetUserId: otherId,
      competencyId: sourceCompetency.id,
    });
    const dmMessage = await dmThreadsService.createMessage(thread.id, forwarderId, { body: 'Private message' });

    // forwarderId IS a participant of `thread` — no exception (AC2's "без
    // винятків, навіть якщо викликач сам учасник того DM-треду").
    await expect(
      chatForwardsService.createForward(forwarderId, {
        sourceMessageId: dmMessage.id,
        destinationType: 'competencyChat',
        destinationId: destCompetency.id,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      chatForwardsService.createForward(forwarderId, {
        sourceMessageId: dmMessage.id,
        destinationType: 'competencyChat',
        destinationId: destCompetency.id,
      }),
    ).rejects.toMatchObject({ messageKey: 'errors.chat.forwardFromDmForbidden' });

    // Also rejected for the OTHER participant, and even when the caller
    // isn't a participant at all — the rule has no per-caller exception.
    await expect(
      chatForwardsService.createForward(otherId, {
        sourceMessageId: dmMessage.id,
        destinationType: 'competencyChat',
        destinationId: destCompetency.id,
      }),
    ).rejects.toMatchObject({ messageKey: 'errors.chat.forwardFromDmForbidden' });
  });

  it('AC7: a message that WAS forwarded from a competency chat into a DM thread cannot itself be forwarded further (transitive rule)', async () => {
    const originalMessage = await competencyChatService.createMessage(sourceCompetency.id, otherId, {
      body: 'Will be forwarded twice',
    });

    await setWillingToTeach(otherId, destCompetency.id, true);
    const { thread } = await dmThreadsService.getOrCreateThread(forwarderId, {
      targetUserId: otherId,
      competencyId: destCompetency.id,
    });

    // A -> B: competency chat message forwarded into the DM thread.
    const forwardedIntoDm = await chatForwardsService.createForward(forwarderId, {
      sourceMessageId: originalMessage.id,
      destinationType: 'dmThread',
      destinationId: thread.id,
    });

    // B is now a real dm_messages row (even though it carries
    // forwarded_from_competency_id) — forwarding B further must be
    // rejected the SAME way a genuine DM message is, based on which table
    // it currently lives in, not its forwarded_from_competency_id history.
    const anotherDestCompetency = await makeCompetency('fwd-dest-2');
    await expect(
      chatForwardsService.createForward(otherId, {
        sourceMessageId: forwardedIntoDm.id,
        destinationType: 'competencyChat',
        destinationId: anotherDestCompetency.id,
      }),
    ).rejects.toMatchObject({ messageKey: 'errors.chat.forwardFromDmForbidden' });

    await db('competencies').where({ id: anotherDestCompetency.id }).delete();
  });

  it('AC3: a sourceMessageId that exists in neither table is 404 errors.chat.messageNotFound', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await expect(
      chatForwardsService.createForward(forwarderId, {
        sourceMessageId: fakeId,
        destinationType: 'competencyChat',
        destinationId: destCompetency.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      chatForwardsService.createForward(forwarderId, {
        sourceMessageId: fakeId,
        destinationType: 'competencyChat',
        destinationId: destCompetency.id,
      }),
    ).rejects.toMatchObject({ messageKey: 'errors.chat.messageNotFound' });
  });

  it('AC4: forwarding into a DM thread the caller is not a participant of is 403 errors.dmThread.forbidden', async () => {
    const originalMessage = await competencyChatService.createMessage(sourceCompetency.id, otherId, {
      body: 'Room message',
    });

    await setWillingToTeach(strangerId, destCompetency.id, true);
    const { thread } = await dmThreadsService.getOrCreateThread(otherId, {
      targetUserId: strangerId,
      competencyId: destCompetency.id,
    });

    // forwarderId is neither `otherId` nor `strangerId` — not a participant.
    await expect(
      chatForwardsService.createForward(forwarderId, {
        sourceMessageId: originalMessage.id,
        destinationType: 'dmThread',
        destinationId: thread.id,
      }),
    ).rejects.toMatchObject({ messageKey: 'errors.dmThread.forbidden' });
  });

  it('AC5: forwarding into a nonexistent or retired competency chat is 404 errors.competencyChat.notFound', async () => {
    const originalMessage = await competencyChatService.createMessage(sourceCompetency.id, otherId, {
      body: 'Room message',
    });
    const fakeId = '00000000-0000-0000-0000-000000000000';

    await expect(
      chatForwardsService.createForward(forwarderId, {
        sourceMessageId: originalMessage.id,
        destinationType: 'competencyChat',
        destinationId: fakeId,
      }),
    ).rejects.toMatchObject({ messageKey: 'errors.competencyChat.notFound' });

    const retired = await makeCompetency('fwd-retired');
    await db('competencies').where({ id: retired.id }).update({ is_active: false });
    await expect(
      chatForwardsService.createForward(forwarderId, {
        sourceMessageId: originalMessage.id,
        destinationType: 'competencyChat',
        destinationId: retired.id,
      }),
    ).rejects.toMatchObject({ messageKey: 'errors.competencyChat.notFound' });
    await db('competencies').where({ id: retired.id }).delete();
  });
});
