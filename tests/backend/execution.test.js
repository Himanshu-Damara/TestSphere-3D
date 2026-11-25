const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getCatalog, validateRunRequest } = require('../../execution/catalog');
const { createFaultConfig } = require('../../execution/faults');
const { RunStore } = require('../../execution/store');

test('approved catalog exposes the three safe targets and executable scenarios', () => {
  const catalog = getCatalog();
  assert.deepEqual(catalog.browsers, ['chromium', 'firefox', 'webkit']);
  assert.deepEqual(catalog.targets.map(target => target.id), ['saucedemo', 'my-website', 'amazon']);
  assert.deepEqual(catalog.tests.map(item => item.id), [
    'saucedemo-valid-login',
    'local-cart-total',
    'amazon-home-smoke',
  ]);
  assert.equal(validateRunRequest({ testId: 'saucedemo-valid-login', browser: 'chromium' }).valid, true);
  assert.equal(validateRunRequest({ testId: 'saucedemo-valid-login', url: 'https://example.com' }).valid, false);
  assert.equal(validateRunRequest({ testId: 'saucedemo-valid-login', command: 'dir' }).valid, false);
  assert.equal(validateRunRequest({ testId: 'local-cart-total' }).valid, true);
  assert.equal(validateRunRequest({ testId: 'local-cart-total', url: 'https://example.com' }).valid, false);
  assert.equal(catalog.targets.find(item => item.id === 'my-website').baseUrl, 'http://localhost:3000/');
  const amazonCases = [...catalog.tests, ...catalog.additionalTests].filter(item => item.targetId === 'amazon');
  assert.equal(amazonCases.length, 30);
  assert.equal(new Set(amazonCases.map(item => item.id)).size, amazonCases.length);
  for (const item of amazonCases) assert.equal(validateRunRequest({ testId: item.id }).valid, true);
  const allCases = [...catalog.tests, ...catalog.additionalTests];
  assert.equal(allCases.filter(item => item.targetId === 'saucedemo').length, 30);
  assert.equal(allCases.filter(item => item.targetId === 'my-website').length, 30);
});

test('local cart fault is disabled by default and only transforms the served script when enabled', () => {
  const faults = createFaultConfig();
  const source = 'const total = subtotal + tax + shipping;';
  assert.equal(faults.transformLocalAppScript(source), source);
  faults.setCartTotal({ enabled: true, mode: 'undercharge', amount: 2.5 });
  assert.match(faults.transformLocalAppScript(source), /subtotal \+ tax \+ shipping - 2\.5/);
  assert.throws(() => faults.setCartTotal({ enabled: true, mode: 'bad', amount: 1 }), /mode/);
});

test('run history and artifact references are persisted without exposing filesystem paths', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'testsphere-store-'));
  const store = new RunStore({ rootDir });
  const run = store.createRun({
    test: { id: 'local-cart-total', name: 'Local QA cart total' },
    target: { id: 'local-qa-lab', name: 'Local QA Lab' },
    browser: 'chromium',
    headed: false,
    screenshots: 'never',
    trace: false,
  });
  const artifactDir = path.join(rootDir, 'artifacts', run.id);
  fs.mkdirSync(artifactDir, { recursive: true });
  const artifactPath = path.join(artifactDir, 'result.txt');
  fs.writeFileSync(artifactPath, 'ok');
  const artifact = store.registerArtifact(run.id, {
    name: 'result.txt',
    kind: 'log',
    filePath: artifactPath,
    contentType: 'text/plain',
  });
  assert.equal(artifact.url, `/api/execution/runs/${run.id}/artifacts/result.txt`);
  assert.equal(Object.prototype.hasOwnProperty.call(artifact, 'filePath'), false);
  assert.equal(store.getArtifactPath(run.id, 'result.txt'), artifactPath);
  store.markStarted(run.id);
  store.updateTest(run.id, 'local-cart-total', { status: 'passed', endedAt: new Date().toISOString() });
  store.appendEvent(run.id, { sequence: 1, kind: 'assertion', type: 'assertion.passed', testId: 'local-cart-total' });
  store.finish(run.id, { status: 'passed' });
  const reopened = new RunStore({ rootDir });
  const saved = reopened.getRun(run.id);
  assert.equal(saved.status, 'passed');
  assert.equal(saved.summary.passed, 1);
  assert.equal(saved.summary.assertions, 1);
  assert.equal(saved.events[0].type, 'assertion.passed');
  assert.equal(reopened.getArtifactPath(run.id, 'result.txt'), artifactPath);
  fs.rmSync(rootDir, { recursive: true, force: true });
});

test('unfinished runs are recovered as failed after a server restart', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'testsphere-recovery-'));
  const store = new RunStore({ rootDir });
  const run = store.createRun({ tests: [{ id: 'one', name: 'One' }, { id: 'two', name: 'Two' }], target: { id: 'my-website', name: 'My Website' }, browser: 'chromium', headed: true, screenshots: 'never', trace: false });
  store.markStarted(run.id);
  store.updateTest(run.id, 'one', { status: 'running' });
  const reopened = new RunStore({ rootDir });
  reopened.recoverInterruptedRuns();
  const recovered = reopened.getRun(run.id);
  assert.equal(recovered.status, 'failed');
  assert.equal(recovered.tests[0].status, 'failed');
  assert.equal(recovered.tests[1].status, 'cancelled');
  assert.equal(recovered.summary.failed, 1);
  reopened.runs.push({ id: 'legacy_run', status: 'running', startedAt: new Date().toISOString(), events: [] });
  reopened.persist();
  const legacyStore = new RunStore({ rootDir });
  legacyStore.recoverInterruptedRuns();
  assert.equal(legacyStore.getRun('legacy_run').status, 'failed');
  fs.rmSync(rootDir, { recursive: true, force: true });
});
