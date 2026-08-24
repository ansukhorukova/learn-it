/**
 * Adds `public_name` to `users` — AUTH-004. Optional, user-edited name shown
 * to OTHER users in shared contexts (board_members/task_shares listings,
 * SharePanel) INSTEAD OF the system-generated, never-editable `display_name`
 * (see users_table migration's `display_name` comment) — falls back to
 * `display_name` when null (AUTH-004 AC5/AC6).
 *
 * Nullable by design, not just "not filled in yet": AUTH-004 AC3 makes
 * clearing the field back to NULL a legitimate, non-error action (explicit
 * reset to the display_name fallback), not merely an unset default.
 *
 * No DB-level length CHECK (100 chars, AUTH-004 AC4) — validated in the
 * service layer (users.service.js's updateProfile), consistent with every
 * other free-text length limit in this schema (board title/description,
 * task title, etc. — none of them have a DB CHECK either).
 */

exports.up = function up(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.text('public_name').nullable();
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('public_name');
  });
};
