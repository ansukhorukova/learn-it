/**
 * `attachment_viewers` table — CLAUDE.md "Дані": attachment_viewers
 * (attachment_id, user_id), used only for `attachments.visibility =
 * 'selected'`. Created now (schema foundation for the board/task sharing
 * feature) but deliberately NOT wired to any service/route this pass — no
 * visibility picker UI exists yet (attachments.service.js's insertAttachment
 * still hardcodes `visibility: 'private'` on every create), and per this
 * feature's scope, attachment-visibility management stays out of scope; only
 * `board_members`/`task_shares` get CRUD endpoints. Adding this table now
 * means a later "attachment visibility" pass is a service/route change only,
 * no migration.
 *
 * `attachment_id`/`user_id` are both `ON DELETE CASCADE` — deleting an
 * attachment or a user removes any viewer-grant rows referencing it,
 * mirroring every other join table in this schema
 * (board_members/task_shares above, attachments.created_by, etc).
 *
 * `UNIQUE (attachment_id, user_id)` — a user is either selected as a viewer
 * of a given attachment or not; no meaning to more than one row per pair.
 *
 * Both FK columns are indexed (code-reviewer MINOR finding), consistent
 * with `board_members`/`task_shares` above: `attachment_id` for "who can
 * see this attachment" lookups (the eventual visibility check), `user_id`
 * for "which attachments is this user individually selected on" (the
 * eventual "shared with me" / per-user grant listing).
 */

exports.up = function up(knex) {
  return knex.schema.createTable('attachment_viewers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('attachment_id')
      .notNullable()
      .references('id')
      .inTable('attachments')
      .onDelete('CASCADE');
    table
      .text('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['attachment_id', 'user_id']);
    table.index('attachment_id');
    table.index('user_id');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('attachment_viewers');
};
