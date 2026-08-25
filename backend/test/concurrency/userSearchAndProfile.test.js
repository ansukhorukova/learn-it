// Tester coverage for US-025 (GET /users/search) and US-026
// (GET /users/:id) — service-layer only, no HTTP/auth-middleware layer
// exercised anywhere in this codebase's tests (every existing suite calls
// services directly, see taskComments.test.js et al.). Lives under
// test/concurrency/ for the same reason as every other suite there:
// vitest.config.js only includes that glob, and this needs the real
// Postgres connection the concurrency harness sets up.
const { db, createUser, cleanupUser } = require('./helpers');
const usersService = require('../../src/services/users.service');
const { NotFoundError } = require('../../src/lib/serviceErrors');

async function setCompetency(userId, competencyId, willing) {
  await db('user_competencies')
    .insert({ user_id: userId, competency_id: competencyId, is_custom: false, willing_to_teach: willing })
    .onConflict(['user_id', 'competency_id'])
    .merge({ willing_to_teach: willing });
}

describe('US-025 user search by competency', () => {
  let competency;
  let otherCompetency;
  let teacherId;

  beforeEach(async () => {
    const rows = await db('competencies').where({ is_active: true }).limit(2);
    [competency, otherCompetency] = rows;
    teacherId = await createUser({ displayName: 'Teacher Name' });
  });

  afterEach(async () => {
    await cleanupUser(teacherId);
  });

  it('AC1/AC4: only users with willing_to_teach=true for THIS competency are returned, with their full willing-to-teach list', async () => {
    await setCompetency(teacherId, competency.id, true);
    await setCompetency(teacherId, otherCompetency.id, true);

    const results = await usersService.searchByCompetency(competency.id);
    const found = results.find((r) => r.id === teacherId);
    expect(found).toBeDefined();
    expect(found.name).toBe('Teacher Name');
    const competencyIds = found.competencies.map((c) => c.competencyId);
    expect(competencyIds).toEqual(expect.arrayContaining([competency.id, otherCompetency.id]));
    expect(found.competencies.every((c) => c.willingToTeach === true)).toBe(true);
  });

  it('AC1: a user who has the competency but willing_to_teach=false is excluded', async () => {
    await setCompetency(teacherId, competency.id, false);
    const results = await usersService.searchByCompetency(competency.id);
    expect(results.find((r) => r.id === teacherId)).toBeUndefined();
  });

  it('AC3: no matches returns an empty array, not an error', async () => {
    const results = await usersService.searchByCompetency(competency.id);
    expect(results).toEqual([]);
  });

  it('AC4: a public_name, when set, is preferred over display_name', async () => {
    await db('users').where({ id: teacherId }).update({ public_name: 'Public Alias' });
    await setCompetency(teacherId, competency.id, true);
    const results = await usersService.searchByCompetency(competency.id);
    expect(results.find((r) => r.id === teacherId).name).toBe('Public Alias');
  });

  it('AC4: result shape never includes email or any other private field', async () => {
    await setCompetency(teacherId, competency.id, true);
    const results = await usersService.searchByCompetency(competency.id);
    const found = results.find((r) => r.id === teacherId);
    expect(found).not.toHaveProperty('email');
    expect(Object.keys(found).sort()).toEqual(['competencies', 'id', 'name']);
  });

  it('a missing/malformed competencyId returns an empty array rather than throwing', async () => {
    await expect(usersService.searchByCompetency(undefined)).resolves.toEqual([]);
    await expect(usersService.searchByCompetency('not-a-uuid')).resolves.toEqual([]);
  });

  it('AC7: I see myself in results if I match, with no special exclusion', async () => {
    await setCompetency(teacherId, competency.id, true);
    const results = await usersService.searchByCompetency(competency.id);
    // searchByCompetency has no notion of "caller" to exclude — the route
    // passes through whatever it returns, confirming there's no filter here.
    expect(results.map((r) => r.id)).toContain(teacherId);
  });
});

describe('US-026 public profile', () => {
  let userId;
  let competency;

  beforeEach(async () => {
    userId = await createUser({ displayName: 'Profile Owner' });
    competency = await db('competencies').where({ is_active: true }).first();
  });

  afterEach(async () => {
    await cleanupUser(userId);
  });

  it('AC1: returns id/name and the FULL competency list with a willingToTeach flag per entry (not just willing=true ones)', async () => {
    await setCompetency(userId, competency.id, false);
    const profile = await usersService.getPublicProfile(userId);
    expect(profile.id).toBe(userId);
    expect(profile.name).toBe('Profile Owner');
    const entry = profile.competencies.find((c) => c.competencyId === competency.id);
    expect(entry).toBeDefined();
    expect(entry.willingToTeach).toBe(false);
  });

  it('AC1: public_name is preferred over display_name when set', async () => {
    await db('users').where({ id: userId }).update({ public_name: 'Chosen Alias' });
    const profile = await usersService.getPublicProfile(userId);
    expect(profile.name).toBe('Chosen Alias');
  });

  it('AC1: never exposes email or other private fields', async () => {
    const profile = await usersService.getPublicProfile(userId);
    expect(profile).not.toHaveProperty('email');
    expect(Object.keys(profile).sort()).toEqual(['competencies', 'id', 'name']);
  });

  it('AC2: a nonexistent userId is 404 errors.user.notFound', async () => {
    await expect(usersService.getPublicProfile('does-not-exist')).rejects.toBeInstanceOf(NotFoundError);
    await expect(usersService.getPublicProfile('does-not-exist')).rejects.toMatchObject({
      messageKey: 'errors.user.notFound',
    });
  });

  it('AC7: my own id resolves normally (not an error) — the "message myself" restriction is a DM-thread rule, not a profile-view rule', async () => {
    const profile = await usersService.getPublicProfile(userId);
    expect(profile.id).toBe(userId);
  });
});
