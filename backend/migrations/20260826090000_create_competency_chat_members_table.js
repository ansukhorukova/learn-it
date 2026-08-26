/**
 * `competency_chat_members` table — US-031: persistent membership in a
 * competency's group chat (`competency_chat_messages`, US-028). This table
 * determines ONLY what shows up in a user's own "Messages" list (`GET
 * /competency-chats/mine`) — it is deliberately NOT part of the
 * authorization check for reading/writing the chat itself, which stays
 * "any authenticated user" regardless of membership (US-028 AC2/AC3, US-031
 * AC4) — an explicit exception to this schema's usual "table = authorization
 * boundary" shape, confirmed by business-analyst for this pass.
 *
 * `competency_id` is `ON DELETE CASCADE` for FK consistency with the rest
 * of this schema (same treatment as `competency_chat_messages.competency_id`),
 * though in practice a `competencies` row is never hard-deleted.
 * Deactivating a competency (`is_active = false`) does NOT touch this table
 * at all — no cascade on retirement (US-031 AC7, same "no cascade delete on
 * retirement" principle as `user_competencies`/`boards.category_id`/
 * `competency_chat_messages`). An existing membership row survives and is
 * surfaced by the FE as an archived/disabled entry (US-033 AC5).
 *
 * `user_id` is `ON DELETE CASCADE` — if a user is ever removed, their
 * membership rows go with them, same treatment as every other per-user
 * table in this schema.
 *
 * Leaving a chat is a HARD DELETE of this row (US-031 AC2) — unlike
 * `competency_chat_messages`, membership is a current subscription state,
 * not a historical record, so the "never delete" principle applied
 * elsewhere in this schema does not extend to the membership row itself.
 *
 * `UNIQUE (user_id, competency_id)` backs the idempotent join contract
 * (US-031 AC1) — the service layer's INSERT uses `onConflict(...).ignore()`
 * against this constraint, same defense-in-depth shape as
 * `user_competencies`' unique constraint / `addUserCompetency`.
 */

exports.up = function up(knex) {
  return knex.schema.createTable('competency_chat_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table
      .uuid('competency_id')
      .notNullable()
      .references('id')
      .inTable('competencies')
      .onDelete('CASCADE');
    table.timestamp('joined_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['user_id', 'competency_id']);
    table.index('user_id');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('competency_chat_members');
};
