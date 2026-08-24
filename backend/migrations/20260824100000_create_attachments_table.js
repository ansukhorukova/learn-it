/**
 * `attachments` table — CLAUDE.md "Дані": attachments (task_id, created_by,
 * kind enum `file | link | note`, title, storage_path/url, mime_type, body,
 * visibility enum `private | shared | selected`).
 *
 * `task_id` is `ON DELETE CASCADE` so deleting a task (US7, already done)
 * always removes its attachment rows at the DB level too — mirrors how
 * `tasks.board_id` cascades from `boards`. Note this only removes the *DB
 * row*; the corresponding MinIO object (for `kind = 'file'`) is NOT
 * automatically cleaned up by this cascade — see tasks.service.js's
 * deleteTask and boards.service.js's deleteBoard, which now collect
 * file-kind `storage_path`s before the cascading delete and remove those
 * objects from storage afterward (best-effort), so a task/board delete
 * doesn't leave orphaned MinIO objects behind.
 *
 * No `attachment_viewers` table yet — deliberately deferred, per the
 * approved scope for this pass: it only matters for `visibility =
 * 'selected'`, which has no consumer until the sharing feature exists. The
 * `visibility` enum column is created now (with the full 3-value range) so a
 * later sharing pass doesn't need a schema migration to add it, but every
 * row this pass creates always gets `visibility = 'private'` — no picker UI
 * yet (product decision, see fullstack-developer task brief for this US9
 * pass).
 *
 * `storage_path` (object key in the S3-compatible bucket, `kind = 'file'`
 * only) and `url` (external link, `kind = 'link'` only) are both nullable
 * and mutually exclusive by convention enforced in the service layer, not a
 * DB constraint — simpler than a CHECK across kind/columns for a 3-way enum,
 * and the service layer is already the single point of authorization/
 * validation for this table per CLAUDE.md.
 */

exports.up = async function up(knex) {
  await knex.raw("CREATE TYPE attachment_kind AS ENUM ('file', 'link', 'note')");
  await knex.raw("CREATE TYPE attachment_visibility AS ENUM ('private', 'shared', 'selected')");

  await knex.schema.createTable('attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('task_id')
      .notNullable()
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE');
    table
      .text('created_by')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.specificType('kind', 'attachment_kind').notNullable();
    // File: original filename. Link: link title. Note: unused (note text
    // lives in `body`).
    table.text('title').nullable();
    // File only: object key in the S3-compatible bucket (STORAGE_BUCKET).
    table.text('storage_path').nullable();
    // Link only: the target URL.
    table.text('url').nullable();
    // File only: the uploaded file's MIME type.
    table.text('mime_type').nullable();
    // Note only: the note text.
    table.text('body').nullable();
    table.specificType('visibility', 'attachment_visibility').notNullable().defaultTo('private');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('task_id');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('attachments');
  await knex.raw('DROP TYPE IF EXISTS attachment_kind');
  await knex.raw('DROP TYPE IF EXISTS attachment_visibility');
};
