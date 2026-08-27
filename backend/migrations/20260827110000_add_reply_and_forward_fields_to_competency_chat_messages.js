/**
 * US-035/US-036 — `competency_chat_messages` gains the same two columns as
 * `dm_messages` (see that migration's header comment for the full
 * reasoning), applied to this table by analogy:
 *
 * `reply_to_message_id` — quote-style "replying to" pointer (US-035),
 * scoped to the SAME `competency_id` room, validated at the service layer
 * (competencyChat.service.js's createMessage, via lib/chatMessages.js's
 * resolveReplyTarget). `ON DELETE SET NULL`.
 *
 * `forwarded_from_competency_id` — set when this message was created by
 * forwarding FROM another (or, degenerately, the same) competency chat room
 * (US-036 AC1) — never from a DM source (AC2: forwarding a DM is
 * forbidden). `ON DELETE SET NULL`, same reasoning as `dm_messages`.
 */

exports.up = function up(knex) {
  return knex.schema.alterTable('competency_chat_messages', (table) => {
    table
      .uuid('reply_to_message_id')
      .nullable()
      .references('id')
      .inTable('competency_chat_messages')
      .onDelete('SET NULL');
    table
      .uuid('forwarded_from_competency_id')
      .nullable()
      .references('id')
      .inTable('competencies')
      .onDelete('SET NULL');
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable('competency_chat_messages', (table) => {
    table.dropColumn('forwarded_from_competency_id');
    table.dropColumn('reply_to_message_id');
  });
};
