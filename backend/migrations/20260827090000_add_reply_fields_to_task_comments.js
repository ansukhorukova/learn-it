/**
 * US-034 — `task_comments` gains two self-referencing nullable FKs to
 * support 3-level-deep replies with level-3 flattening (see this
 * migration's companion service, taskComments.service.js's
 * resolveReplyTarget, for the full algorithm — AC1-3 of US-034).
 *
 * `parent_comment_id` is the REAL tree edge — determines visual nesting
 * depth (max 3, enforced by the flatten algorithm in the service layer, not
 * a DB constraint) and grouping. `ON DELETE CASCADE`: since there is no
 * edit/delete endpoint for an individual comment in this pass (US-019
 * AC10/US-034 AC13 — still unchanged), this only ever fires as part of the
 * bulk `task_id`-cascade when a whole task is deleted (US-019 AC9/US-034
 * AC12) — Postgres deletes every `task_comments` row for that task in one
 * statement, so this self-referencing cascade never actually chains
 * row-by-row through any current product code path, but CASCADE is still
 * the structurally correct ON DELETE behavior for a real parent/child edge.
 *
 * `reply_to_comment_id` is a purely TEXTUAL "in reply to" pointer for the
 * UI's quote preview — it can point deeper than `parent_comment_id` in the
 * flatten case (US-034 AC3: a reply to a level-3 comment flattens to a
 * level-3 sibling, but `reply_to_comment_id` still names the exact comment
 * the user clicked "Reply" on). `ON DELETE SET NULL` (not CASCADE): losing
 * the precise "in reply to" attribution when its target disappears should
 * never take down the replying comment itself.
 *
 * Both columns are added nullable with no backfill needed — every existing
 * row is implicitly a level-1, non-reply comment (`NULL`/`NULL`), exactly
 * what AC4 defines as the no-reply case.
 *
 * Index on `parent_comment_id` — the FE builds the visual tree client-side
 * from the flat `GET .../comments` list (AC9/AC10), grouping by this
 * column; the index isn't required for that (no pagination, no server-side
 * grouping query), but matches the "index every FK a read path might filter
 * on" convention already used elsewhere in this schema.
 */

exports.up = function up(knex) {
  return knex.schema.alterTable('task_comments', (table) => {
    table.uuid('parent_comment_id').nullable().references('id').inTable('task_comments').onDelete('CASCADE');
    table.uuid('reply_to_comment_id').nullable().references('id').inTable('task_comments').onDelete('SET NULL');
    table.index(['parent_comment_id']);
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable('task_comments', (table) => {
    table.dropColumn('reply_to_comment_id');
    table.dropColumn('parent_comment_id');
  });
};
