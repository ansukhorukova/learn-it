// Shared row-locking primitives for the "read, lock, mutate" pattern used by
// every board/task mutation that needs to serialize against a concurrent
// delete of the same row (CLAUDE.md: the BE service layer is the single
// point of authorization/consistency — it must not silently crash or
// silently "succeed" on a row that disappeared mid-request).
//
// This exact bug (unlocked pre-transaction read -> mutation -> return
// toX(row) without checking `row` exists) was independently hand-fixed four
// times across three review passes (createTask, updateTask's reorder
// branch, deleteTask, deleteBoard) before recurring a fourth/fifth time in
// updateTask's title-only branch and updateBoard. The duplication itself was
// the bug: every new read-then-write call site had to remember to
// re-implement "SELECT ... FOR UPDATE, then check the row exists" by hand,
// and it's exactly the step that kept getting skipped. Routing every such
// call site through the two functions below means the existence check lives
// in one place and can't be forgotten at a new call site.
//
// Both functions REQUIRE an already-open transaction (`trx`) — the lock is
// only meaningful for the lifetime of a transaction, so there's no bare/
// unlocked variant here on purpose. A caller can't accidentally take the
// "forgot to lock" path because there's nothing to call outside a trx.

/**
 * `SELECT ... FOR UPDATE` by primary key, within `trx`. Throws
 * `makeNotFoundError()` if the row doesn't exist (never been there, or
 * removed by a concurrent transaction that already committed) instead of
 * resolving to `undefined` for the caller to forget to check.
 *
 * `makeNotFoundError` is a thunk (`() => Error`), not an Error instance, so
 * callers can pass a resource-specific NotFoundError (different
 * `messageKey` per table) without constructing it — and paying for its
 * stack trace — on the common path where the row exists.
 */
async function lockRow(trx, table, id, makeNotFoundError) {
  const row = await trx(table).where({ id }).forUpdate().first();
  if (!row) throw makeNotFoundError();
  return row;
}

/**
 * Locks the row (see `lockRow`), then applies `patch` via
 * `UPDATE ... RETURNING *` and returns the updated row. Throws
 * `makeNotFoundError()` if the row doesn't exist — this is what makes it
 * safe for a caller to pass the result straight into a `toX(row)` mapper
 * without an `if (!row)` check of its own.
 *
 * `patch` may be `{}` — the row is still locked and existence-checked, just
 * returned unmodified with no UPDATE statement executed, so a caller with an
 * empty patch (e.g. a PATCH request with no recognized fields set) doesn't
 * need a separate code path to skip the transaction.
 *
 * The `RETURNING *` result is checked too, not just the initial lock: in
 * isolation that second check is unreachable (the row can't be deleted
 * between the lock and the UPDATE inside the same transaction/connection —
 * the lock is held until commit), but it costs nothing and it means this
 * function can never hand a caller `undefined`, regardless of how it's
 * called or how the locking above might change later.
 */
async function lockedUpdate(trx, table, id, patch, makeNotFoundError) {
  await lockRow(trx, table, id, makeNotFoundError);
  if (Object.keys(patch).length === 0) {
    return trx(table).where({ id }).first();
  }
  const [row] = await trx(table).where({ id }).update(patch).returning('*');
  if (!row) throw makeNotFoundError();
  return row;
}

module.exports = { lockRow, lockedUpdate };
