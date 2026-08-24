/**
 * `boards.category_id` — CLAUDE.md "Дані" / US-021: an optional board
 * category, drawn from the SAME `competencies` dictionary already used for
 * `user_competencies` (business-analyst's approved decision #2 — reuse, no
 * new dictionary table). Nullable — "Без категорії" is the default, not a
 * separate sentinel value.
 *
 * `ON DELETE SET NULL` (not CASCADE, unlike `user_competencies.competency_id`):
 * a `competencies` row is never actually deleted in practice (retired via
 * `is_active = false` instead — see that migration), but if it ever were,
 * losing the category classification shouldn't take the whole board down
 * with it. `is_active = false` alone deliberately does NOT clear this column
 * (US-021 AC6 — a board keeps a category it was assigned while active, even
 * after that category is later deactivated); that's a service-layer
 * decision (boards.service.js never re-validates an already-stored
 * category_id), this FK constraint only governs the one currently
 * unreachable case (the competencies row disappearing outright).
 */

exports.up = function up(knex) {
  return knex.schema.alterTable('boards', (table) => {
    table
      .uuid('category_id')
      .nullable()
      .references('id')
      .inTable('competencies')
      .onDelete('SET NULL');
    table.index('category_id');
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable('boards', (table) => {
    table.dropColumn('category_id');
  });
};
