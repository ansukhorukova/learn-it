/**
 * US-035/US-036 — `dm_messages` gains two independent nullable columns:
 *
 * `reply_to_message_id` — a quote-style "replying to" pointer (US-035),
 * NOT a tree like `task_comments.parent_comment_id` (US-034) — a flat,
 * Telegram/Slack-style reference within the SAME thread. "Same thread" is
 * validated at the service layer (dmThreads.service.js's createMessage, via
 * lib/chatMessages.js's resolveReplyTarget), since a plain Postgres FK can't
 * express "must belong to the same thread_id as the referencing row".
 * `ON DELETE SET NULL` — there is no edit/delete endpoint for a message in
 * this pass, so this is a structural safety net, not a path any current
 * product code triggers.
 *
 * `forwarded_from_competency_id` — set ONLY by a successful forward
 * (US-036 AC1) whose SOURCE was a `competency_chat_messages` row; NEVER set
 * by a forward whose source is `dm_messages` — forwarding a DM message is
 * forbidden by design (AC2), so no code path can ever populate this column
 * from a DM source. References `competencies.id`, `ON DELETE SET NULL` — a
 * competency is never hard-deleted in this schema (retired via
 * `is_active = false` instead), but SET NULL is the structurally safe
 * choice for an attribution field regardless: losing the pointer should
 * just mean "no attribution shown", never cascading away the message.
 */

exports.up = function up(knex) {
  return knex.schema.alterTable('dm_messages', (table) => {
    table.uuid('reply_to_message_id').nullable().references('id').inTable('dm_messages').onDelete('SET NULL');
    table
      .uuid('forwarded_from_competency_id')
      .nullable()
      .references('id')
      .inTable('competencies')
      .onDelete('SET NULL');
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable('dm_messages', (table) => {
    table.dropColumn('forwarded_from_competency_id');
    table.dropColumn('reply_to_message_id');
  });
};
