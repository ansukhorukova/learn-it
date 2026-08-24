// Small helper for recognizing a specific Postgres constraint violation on a
// raw driver error, so service-layer catch blocks can map it to a clean
// ConflictError (see lib/serviceErrors.js) instead of leaking a raw `pg`
// error to the client. `23505` is Postgres's SQLSTATE for unique_violation;
// `err.constraint` is the constraint name pg reports alongside it.
function isUniqueViolation(err, constraintName) {
  if (!err || err.code !== '23505') return false;
  return constraintName ? err.constraint === constraintName : true;
}

// `40P01` is Postgres's SQLSTATE for deadlock_detected. Postgres picks one of
// the two deadlocked transactions as the "victim" and aborts it with this
// code so the other can proceed. Callers should treat this the same as a
// unique-violation backstop: map it to a clean 409 ConflictError instead of
// leaking the raw `pg` error to the client as a 500.
function isDeadlock(err) {
  return !!err && err.code === '40P01';
}

// `23503` is Postgres's SQLSTATE for foreign_key_violation. Surfaces when an
// INSERT (or UPDATE) references a parent row that no longer exists — e.g.
// creating an attachment for a task a concurrent deleteTask just removed
// between the service layer's ownership check and the INSERT. Callers should
// map this to a clean NotFoundError for the missing parent rather than
// leaking the raw `pg` error as a 500. `err.constraint` is the FK constraint
// name pg reports alongside it, same as isUniqueViolation.
function isForeignKeyViolation(err, constraintName) {
  if (!err || err.code !== '23503') return false;
  return constraintName ? err.constraint === constraintName : true;
}

module.exports = { isUniqueViolation, isDeadlock, isForeignKeyViolation };
