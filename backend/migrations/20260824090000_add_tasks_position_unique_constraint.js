/**
 * Backstop for the position/reindex race condition flagged in code review
 * (CLAUDE.md: BE service layer does the authorization/locking, but a DB
 * constraint is the last line of defense if a future code path ever bypasses
 * the `FOR UPDATE` locking added in tasks.service.js). Without this, two
 * concurrent writers under READ COMMITTED could silently give two tasks in
 * the same (board_id, status) column the same `position` — now it's a loud,
 * explicit 23505 unique_violation instead of silent ordering corruption.
 *
 * DEFERRABLE INITIALLY DEFERRED is essential here, not incidental: the
 * gap-based reindex in tasks.service.js's reindexColumn() updates a
 * column's rows one at a time, and can pass through a *momentary* duplicate
 * position mid-transaction while two rows are swapping places (e.g. A:
 * 1000->2000 while B is still at 2000, until B's own update lands a moment
 * later). A plain (non-deferrable) unique constraint checks after every
 * statement and would reject that intermediate state even though the
 * transaction's final, committed state is always conflict-free. Deferring
 * the check to COMMIT time lets the reindex do its row-by-row swap and only
 * enforces uniqueness on the state that's actually about to be persisted.
 *
 * Plain `table.unique(...)` in Knex's schema builder doesn't expose
 * DEFERRABLE, so this is raw SQL instead.
 */

exports.up = async function up(knex) {
  await knex.raw(`
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_board_status_position_unique
    UNIQUE (board_id, status, position)
    DEFERRABLE INITIALLY DEFERRED
  `);
};

exports.down = async function down(knex) {
  await knex.raw('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_board_status_position_unique');
};
