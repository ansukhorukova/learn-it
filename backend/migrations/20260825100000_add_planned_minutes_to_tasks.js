/**
 * Adds `planned_minutes` to `tasks` — US-020. Optional estimate of how long
 * a task is expected to take, in minutes, shown alongside the actually
 * logged time (`totalSeconds`, US12) as a simple "estimated / logged"
 * comparison — no progress bar or over/under indicator (explicit scope
 * decision, see USER_STORIES.md US-020 AC7).
 *
 * Nullable by design, same "explicit reset is a legitimate action, not
 * merely an unset default" pattern as `users.public_name` (AUTH-004 AC3,
 * see that migration's comment): AC3 makes clearing both the hours/minutes
 * fields back to NULL a deliberate, non-error reset, not a validation
 * failure.
 *
 * No DB-level range CHECK (0-9999, AC4/AC5) — validated in the service
 * layer (tasks.service.js's validatePlannedMinutes), consistent with every
 * other numeric/length limit in this schema (task title length, manual
 * time-entry minutes, etc.).
 */

exports.up = function up(knex) {
  return knex.schema.alterTable('tasks', (table) => {
    table.integer('planned_minutes').nullable();
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable('tasks', (table) => {
    table.dropColumn('planned_minutes');
  });
};
