// Tester coverage for US-035 (quote-style reply in DM + competency chat) —
// replyTo hydration shape ({id, authorName, excerpt}) on both GET/list and
// the freshly-created message, the same-thread/same-room scoping rule
// (AC3/AC4), and that a reply never bypasses the existing body-validation/
// access gates. Lives under test/concurrency/ for the same reason as
// dmThreads.test.js/competencyChat.test.js — needs the real Postgres
// connection the concurrency harness sets up.
const { db, createUser, cleanupUser } = require('./helpers');
const dmThreadsService = require('../../src/services/dmThreads.service');
const competencyChatService = require('../../src/services/competencyChat.service');
const { ValidationError } = require('../../src/lib/serviceErrors');

async function setWillingToTeach(userId, competencyId, willing = true) {
  await db('user_competencies')
    .insert({ user_id: userId, competency_id: competencyId, is_custom: false, willing_to_teach: willing })
    .onConflict(['user_id', 'competency_id'])
    .merge({ willing_to_teach: willing });
}

describe('US-035 chat quote-reply', () => {
  describe('DM threads', () => {
    let callerId;
    let targetId;
    let competency;
    let thread;

    beforeEach(async () => {
      callerId = await createUser();
      targetId = await createUser();
      competency = await db('competencies').where({ is_active: true }).first();
      await setWillingToTeach(targetId, competency.id, true);
      const { thread: t } = await dmThreadsService.getOrCreateThread(callerId, {
        targetUserId: targetId,
        competencyId: competency.id,
      });
      thread = t;
    });

    afterEach(async () => {
      await cleanupUser(callerId);
      await cleanupUser(targetId);
    });

    it('AC1/AC5/AC6: a reply carries replyTo {id, authorName, excerpt} on both the immediate response and GET history', async () => {
      const original = await dmThreadsService.createMessage(thread.id, callerId, {
        body: 'This is the original message that will be quoted',
      });

      const reply = await dmThreadsService.createMessage(thread.id, targetId, {
        body: 'Replying now',
        replyToMessageId: original.id,
      });
      expect(reply.replyTo).toMatchObject({
        id: original.id,
        excerpt: 'This is the original message that will be quoted',
      });
      expect(reply.replyTo.authorName).toBeTruthy();

      const history = await dmThreadsService.listMessages(thread.id, callerId);
      const found = history.find((m) => m.id === reply.id);
      expect(found.replyTo).toMatchObject({ id: original.id });

      const originalInHistory = history.find((m) => m.id === original.id);
      expect(originalInHistory.replyTo).toBeNull();
    });

    it('AC5/AC6: the excerpt is truncated to ~80 characters', async () => {
      const longBody = 'x'.repeat(200);
      const original = await dmThreadsService.createMessage(thread.id, callerId, { body: longBody });
      const reply = await dmThreadsService.createMessage(thread.id, targetId, {
        body: 'Reply',
        replyToMessageId: original.id,
      });
      expect(reply.replyTo.excerpt).toHaveLength(80);
      expect(reply.replyTo.excerpt).toBe(longBody.slice(0, 80));
    });

    it('AC9: replying to your own message is allowed', async () => {
      const original = await dmThreadsService.createMessage(thread.id, callerId, { body: 'My own message' });
      const reply = await dmThreadsService.createMessage(thread.id, callerId, {
        body: 'Replying to myself',
        replyToMessageId: original.id,
      });
      expect(reply.replyTo.id).toBe(original.id);
    });

    it('AC4: a nonexistent replyToMessageId is 400 errors.chat.replyTargetInvalid, message not created', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(
        dmThreadsService.createMessage(thread.id, callerId, { body: 'Nope', replyToMessageId: fakeId }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        dmThreadsService.createMessage(thread.id, callerId, { body: 'Nope', replyToMessageId: fakeId }),
      ).rejects.toMatchObject({ messageKey: 'errors.chat.replyTargetInvalid' });

      const rows = await db('dm_messages').where({ thread_id: thread.id, body: 'Nope' });
      expect(rows).toHaveLength(0);
    });

    it('AC3: a replyToMessageId from a DIFFERENT thread is 400 errors.chat.replyTargetInvalid', async () => {
      const otherCompetency = await db('competencies').where({ is_active: true }).andWhereNot({ id: competency.id }).first();
      await setWillingToTeach(targetId, otherCompetency.id, true);
      const { thread: otherThread } = await dmThreadsService.getOrCreateThread(callerId, {
        targetUserId: targetId,
        competencyId: otherCompetency.id,
      });
      const messageInOtherThread = await dmThreadsService.createMessage(otherThread.id, callerId, {
        body: 'Message in a different thread',
      });

      await expect(
        dmThreadsService.createMessage(thread.id, callerId, {
          body: 'Nope',
          replyToMessageId: messageInOtherThread.id,
        }),
      ).rejects.toMatchObject({ messageKey: 'errors.chat.replyTargetInvalid' });
    });

    it('AC11: an empty body is still 400 errors.dmThread.messageBodyRequired even with a valid replyToMessageId', async () => {
      const original = await dmThreadsService.createMessage(thread.id, callerId, { body: 'Original' });
      await expect(
        dmThreadsService.createMessage(thread.id, callerId, { body: '   ', replyToMessageId: original.id }),
      ).rejects.toMatchObject({ messageKey: 'errors.dmThread.messageBodyRequired' });
    });

    it('AC12: a non-participant is still rejected (errors.dmThread.forbidden) regardless of a valid replyToMessageId', async () => {
      const original = await dmThreadsService.createMessage(thread.id, callerId, { body: 'Original' });
      const strangerId = await createUser();
      await expect(
        dmThreadsService.createMessage(thread.id, strangerId, {
          body: 'Butting in',
          replyToMessageId: original.id,
        }),
      ).rejects.toMatchObject({ messageKey: 'errors.dmThread.forbidden' });
      await cleanupUser(strangerId);
    });
  });

  describe('Competency chat', () => {
    let userId;
    let otherId;
    let competency;

    beforeEach(async () => {
      userId = await createUser();
      otherId = await createUser();
      const [row] = await db('competencies')
        .insert({ slug: `reply-test-${Date.now()}-${Math.random().toString(36).slice(2)}`, is_active: true })
        .returning('*');
      competency = row;
    });

    afterEach(async () => {
      await cleanupUser(userId);
      await cleanupUser(otherId);
      await db('competencies').where({ id: competency.id }).delete();
    });

    it('AC2/AC5/AC6: a reply in the competency room carries replyTo on both the response and GET history', async () => {
      const original = await competencyChatService.createMessage(competency.id, userId, { body: 'Room original' });
      const reply = await competencyChatService.createMessage(competency.id, otherId, {
        body: 'Room reply',
        replyToMessageId: original.id,
      });
      expect(reply.replyTo).toMatchObject({ id: original.id, excerpt: 'Room original' });

      const messages = await competencyChatService.listMessages(competency.id);
      const found = messages.find((m) => m.id === reply.id);
      expect(found.replyTo).toMatchObject({ id: original.id });
    });

    it('AC4: a nonexistent replyToMessageId is 400 errors.chat.replyTargetInvalid', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(
        competencyChatService.createMessage(competency.id, userId, { body: 'Nope', replyToMessageId: fakeId }),
      ).rejects.toMatchObject({ messageKey: 'errors.chat.replyTargetInvalid' });
    });

    it('AC11: an empty body is still 400 errors.competencyChat.messageBodyRequired even with a valid replyToMessageId', async () => {
      const original = await competencyChatService.createMessage(competency.id, userId, { body: 'Original' });
      await expect(
        competencyChatService.createMessage(competency.id, userId, { body: '   ', replyToMessageId: original.id }),
      ).rejects.toMatchObject({ messageKey: 'errors.competencyChat.messageBodyRequired' });
    });

    it('AC3: a replyToMessageId from a DIFFERENT competency room is 400 errors.chat.replyTargetInvalid', async () => {
      const [otherCompetency] = await db('competencies')
        .insert({ slug: `reply-test-other-${Date.now()}-${Math.random().toString(36).slice(2)}`, is_active: true })
        .returning('*');
      const messageInOtherRoom = await competencyChatService.createMessage(otherCompetency.id, userId, {
        body: 'Other room message',
      });

      await expect(
        competencyChatService.createMessage(competency.id, userId, {
          body: 'Nope',
          replyToMessageId: messageInOtherRoom.id,
        }),
      ).rejects.toMatchObject({ messageKey: 'errors.chat.replyTargetInvalid' });

      await db('competencies').where({ id: otherCompetency.id }).delete();
    });
  });
});
