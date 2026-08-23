const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Postgres throws a hard "invalid input syntax for type uuid" error (500) if
// a malformed id is used in a `where` clause — this lets callers translate a
// malformed :id route param into a normal 404 (NOT_FOUND) instead, same as a
// well-formed id that simply doesn't exist. Never used as an authorization
// check by itself, only as a pre-filter before the ownership lookup.
function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

module.exports = { isUuid };
