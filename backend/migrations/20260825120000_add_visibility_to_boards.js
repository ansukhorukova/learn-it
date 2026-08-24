/**
 * `boards.visibility` — CLAUDE.md "Шеринг" (extended by US-022, see the
 * user story's "Відповідність scope": this concept didn't exist before this
 * request — no public/unauthenticated-invite access existed prior to
 * `board_members`/`task_shares`). Native Postgres enum (`board_visibility`),
 * same defense-in-depth reasoning as `board_member_role`/`tasks.status` —
 * an invalid value is rejected at the DB layer behind the service-layer
 * validation in boards.service.js.
 *
 * `NOT NULL DEFAULT 'private'` — every existing board (and every board
 * created without an explicit `visibility` in the request, since `POST
 * /boards` never accepts this field per US-022's API surface — only `PATCH`
 * does) keeps today's behavior unchanged: visible only to the owner and any
 * `board_members`/`task_shares` grant.
 *
 * `visibility = 'public'` grants READ-ONLY access to any authenticated user
 * with no `board_members` row of their own (lib/authz.js's
 * getBoardRole/getTaskRole, `myRole: 'public'`) — it never affects any
 * mutation endpoint's authorization (US-022 AC3: "мутаційні ендпоінти не
 * змінюються"), and it never overrides a real membership role (AC7).
 * `time_entries` privacy and attachment `visibility` rules are completely
 * independent of this column and remain fully enforced for a public visitor
 * (AC4/AC5) — see attachments.service.js's isVisibleTo and
 * timeEntries.service.js's user-scoped queries, neither of which changed to
 * accommodate this column.
 */

exports.up = async function up(knex) {
  await knex.raw("CREATE TYPE board_visibility AS ENUM ('private', 'public')");

  await knex.schema.alterTable('boards', (table) => {
    table.specificType('visibility', 'board_visibility').notNullable().defaultTo('private');
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable('boards', (table) => {
    table.dropColumn('visibility');
  });
  await knex.raw('DROP TYPE IF EXISTS board_visibility');
};
