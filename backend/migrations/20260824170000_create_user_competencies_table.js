/**
 * `user_competencies` table — CLAUDE.md "Дані": a user's own competencies
 * (AUTH-005/AUTH-006), each with its own `willing_to_teach` flag
 * (AUTH-007 — deliberately per-competency, not a single column on `users`).
 *
 * Exactly one of `competency_id` (dictionary pick, `is_custom = false`) /
 * `custom_label` (free text, `is_custom = true`) is ever set — enforced in
 * the service layer (competencies.service.js), not a DB CHECK, same
 * mutual-exclusivity-by-convention decision already made for
 * `attachments.storage_path`/`url` (see that migration's header comment):
 * the service layer is already the single point of validation for this
 * table per CLAUDE.md, and a cross-column CHECK is more machinery than this
 * needs.
 *
 * `competency_id` is `ON DELETE CASCADE` for consistency with every other FK
 * in this schema, though in practice a `competencies` row is never deleted
 * (retired via `is_active = false` instead, see that migration) — this is a
 * backstop, not a path any current code exercises.
 *
 * `UNIQUE (user_id, competency_id)` is what makes "add the same dictionary
 * competency twice" a clean 409 (AUTH-005 AC3) via
 * `addUserCompetency`'s INSERT hitting this constraint as a backstop behind
 * the service layer's own existence check (same defense-in-depth shape as
 * `time_entries_one_active_per_user` in timeEntries.service.js). Crucially,
 * Postgres does NOT treat two NULLs as equal for uniqueness purposes, so
 * this constraint is silently a no-op for custom rows (`competency_id IS
 * NULL`) — exactly what AUTH-006 AC7 wants: duplicate custom labels are
 * explicitly allowed, no unique-index workaround needed for that half of
 * the table.
 */

exports.up = function up(knex) {
  return knex.schema.createTable('user_competencies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .text('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .uuid('competency_id')
      .nullable()
      .references('id')
      .inTable('competencies')
      .onDelete('CASCADE');
    table.boolean('is_custom').notNullable();
    // Only set when is_custom = true (AUTH-006) — free-text, user-generated
    // content, never run through the locale dictionary (unlike the
    // dictionary path's competency.<slug> lookup).
    table.text('custom_label').nullable();
    table.boolean('willing_to_teach').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['user_id', 'competency_id']);
    table.index('user_id');
    table.index('competency_id');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('user_competencies');
};
