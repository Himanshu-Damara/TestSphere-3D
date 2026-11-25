const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function now() {
  return new Date().toISOString();
}

function safeId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
}

class RunStore {
  constructor({ rootDir }) {
    this.rootDir = rootDir;
    this.runsFile = path.join(rootDir, 'runs.json');
    this.artifactsDir = path.join(rootDir, 'artifacts');
    fs.mkdirSync(this.artifactsDir, { recursive: true });
    this.runs = this.readRuns();
  }

  readRuns() {
    try {
      if (!fs.existsSync(this.runsFile)) return [];
      const parsed = JSON.parse(fs.readFileSync(this.runsFile, 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  recoverInterruptedRuns() {
    let changed = false;
    for (const run of this.runs) {
      if (!['queued', 'running', 'stopping'].includes(run.status)) continue;
      run.status = 'failed';
      run.endedAt = now();
      run.durationMs = run.startedAt ? Math.max(0, new Date(run.endedAt) - new Date(run.startedAt)) : null;
      run.error = { message: 'Server stopped before this run finished.' };
      const tests = Array.isArray(run.tests) ? run.tests : [];
      for (const item of tests) {
        if (item.status === 'running') { item.status = 'failed'; item.error = { message: 'Server stopped during this test.' }; }
        else if (item.status === 'pending') item.status = 'cancelled';
      }
      run.summary = run.summary || {};
      run.summary.passed = tests.filter(item => item.status === 'passed').length;
      run.summary.failed = tests.filter(item => item.status === 'failed').length;
      run.summary.skipped = tests.filter(item => item.status === 'skipped').length;
      changed = true;
    }
    if (changed) this.persist();
  }

  persist() {
    fs.mkdirSync(this.rootDir, { recursive: true });
    const temporary = `${this.runsFile}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(this.runs, null, 2), 'utf8');
    try {
      fs.renameSync(temporary, this.runsFile);
    } catch (error) {
      if (!['EPERM', 'EACCES'].includes(error.code)) throw error;
      fs.writeFileSync(this.runsFile, JSON.stringify(this.runs, null, 2), 'utf8');
      try { fs.unlinkSync(temporary); } catch {}
    }
  }

  createRun({ test, tests, target, browser, headed, screenshots, trace, preview }) {
    const selectedTests = tests || [test];
    const id = `run_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
    const run = {
      id,
      testId: selectedTests[0].id,
      testName: selectedTests.length === 1 ? selectedTests[0].name : `${selectedTests.length} selected tests`,
      testIds: selectedTests.map(item => item.id),
      tests: selectedTests.map(item => ({ id: item.id, name: item.name, targetId: item.targetId, status: 'pending', steps: [], assertions: [], error: null })),
      targetId: target.id,
      targetName: target.name,
      browser,
      headed,
      screenshots,
      trace,
      preview: preview !== false,
      status: 'queued',
      createdAt: now(),
      startedAt: null,
      endedAt: null,
      durationMs: null,
      stopRequested: false,
      summary: {
        steps: 0,
        assertions: 0,
        logs: 0,
        screenshots: 0,
        total: selectedTests.length,
        passed: 0,
        failed: 0,
        skipped: 0,
      },
      artifacts: [],
      events: [],
      error: null,
    };
    this.runs.unshift(run);
    this.runs = this.runs.slice(0, 100);
    this.persist();
    return clone(run);
  }

  getRun(runId) {
    const run = this.runs.find(item => item.id === runId);
    return run ? clone(run) : null;
  }

  getRunMutable(runId) {
    return this.runs.find(item => item.id === runId);
  }

  listRuns(limit = 50) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
    return clone(this.runs.slice(0, safeLimit));
  }

  markStarted(runId) {
    const run = this.getRunMutable(runId);
    if (!run) return null;
    run.status = 'running';
    run.startedAt = now();
    this.persist();
    return clone(run);
  }

  requestStop(runId) {
    const run = this.getRunMutable(runId);
    if (!run) return null;
    run.stopRequested = true;
    this.persist();
    return clone(run);
  }

  appendEvent(runId, event) {
    const run = this.getRunMutable(runId);
    if (!run) return null;
    run.events.push(clone(event));
    if (run.events.length > 2000) run.events.splice(0, run.events.length - 2000);
    if (event.kind === 'step') run.summary.steps += 1;
    if (event.kind === 'assertion') run.summary.assertions += 1;
    if (event.kind === 'log') run.summary.logs += 1;
    if (event.kind === 'screenshot') run.summary.screenshots += 1;
    this.persist();
    return clone(event);
  }

  finish(runId, { status, error = null }) {
    const run = this.getRunMutable(runId);
    if (!run) return null;
    run.status = status;
    run.endedAt = now();
    run.durationMs = run.startedAt ? Math.max(0, new Date(run.endedAt) - new Date(run.startedAt)) : null;
    run.error = error;
    this.persist();
    return clone(run);
  }

  updateTest(runId, testId, patch) {
    const run = this.getRunMutable(runId);
    const test = run?.tests?.find(item => item.id === testId);
    if (!test) return null;
    Object.assign(test, clone(patch));
    const counts = { passed: 0, failed: 0, skipped: 0 };
    run.tests.forEach(item => { if (counts[item.status] !== undefined) counts[item.status] += 1; });
    Object.assign(run.summary, counts);
    this.persist();
    return clone(test);
  }

  registerArtifact(runId, { name, kind, filePath, contentType }) {
    const run = this.getRunMutable(runId);
    if (!run || !safeId(runId)) throw new Error('Invalid run id');
    if (typeof name !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(name)) throw new Error('Invalid artifact name');

    const runDir = path.resolve(this.artifactsDir, runId);
    fs.mkdirSync(runDir, { recursive: true });
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(`${runDir}${path.sep}`)) throw new Error('Artifact path is outside the run directory');
    if (!fs.existsSync(resolved)) throw new Error('Artifact file does not exist');

    const artifact = {
      name,
      kind,
      contentType: contentType || 'application/octet-stream',
      size: fs.statSync(resolved).size,
      url: `/api/execution/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(name)}`,
    };
    run.artifacts.push(artifact);
    this.persist();
    return clone(artifact);
  }

  getArtifactPath(runId, name) {
    if (!safeId(runId) || typeof name !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(name)) return null;
    const run = this.getRunMutable(runId);
    if (!run || !run.artifacts.some(artifact => artifact.name === name)) return null;
    const runDir = path.resolve(this.artifactsDir, runId);
    const resolved = path.resolve(runDir, name);
    if (!resolved.startsWith(`${runDir}${path.sep}`) || !fs.existsSync(resolved)) return null;
    return resolved;
  }

  getEvents(runId, since = 0) {
    const run = this.getRunMutable(runId);
    if (!run) return null;
    const sequence = Number(since) || 0;
    return clone(run.events.filter(event => event.sequence > sequence));
  }
}

module.exports = { RunStore };
