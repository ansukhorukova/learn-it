/**
 * `dm_threads` table — CLAUDE.md "Дані" / US-027: one independent thread per
 * (user pair, competency) — the SAME two people get a separate thread, with
 * separate history, for each competency they message each other about
 * (business-analyst decision #2 in USER_STORIES.md's "походження" section
 * for US-025…029).
 *
 * `user_a_id`/`user_b_id` are always stored NORMALIZED — `user_a_id` is
 * whichever of the pair's two Firebase UIDs sorts first lexicographically,
 * `user_b_id` the other (see dmThreads.service.js's `normalizePair`) — so
 * "Alice messages Bob" and "Bob messages Alice" always resolve to the same
 * row instead of two independent ones. This is what makes
 * `UNIQUE (user_a_id, user_b_id, competency_id)` an effective duplicate
 * guard rather than something the application also has to enforce by
 * reading-before-writing (which would still race under concurrent
 * requests) — the DB constraint is the actual backstop.
 *
 * The CHECK constraint below defends the invariant the unique index
 * depends on: if a future bug ever inserted the pair unsorted, (A,B) and
 * (B,A) would silently both be allowed as "different" rows under the plain
 * unique index — this makes that fail loudly at the DB level instead.
 *
 * No `updated_at` — a thread's own row never mutates after creation (its
 * "last activity" for the my-threads list sort, US-027 AC11, is derived
 * from `dm_messages.created_at` in the service layer, not stored here).
 *
 * `ON DELETE CASCADE` on both user FKs and on `competency_id` mirrors the
 * rest of this schema (e.g. `user_competencies`) — hard-deleting a user or
 * a competency (never done by product code — competencies are retired via
 * `is_active = false`, see that migration) takes the thread with it rather
 * than leaving a dangling reference, kept for defense-in-depth.
 */

exports.up = async function up(knex) {
  await knex.schema.createTable('dm_threads', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('user_a_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('user_b_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table
      .uuid('competency_id')
      .notNullable()
      .references('id')
      .inTable('competencies')
      .onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['user_a_id', 'user_b_id', 'competency_id']);
    table.index('user_a_id');
    table.index('user_b_id');
  });

  await knex.schema.raw(
    'ALTER TABLE dm_threads ADD CONSTRAINT dm_threads_user_pair_normalized CHECK (user_a_id < user_b_id)',
  );
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('dm_threads');
};
