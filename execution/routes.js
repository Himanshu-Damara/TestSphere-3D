const express = require('express');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { getCatalog } = require('./catalog');

function jsonError(res, status, message, details) {
  return res.status(status).json({ error: message, ...(details ? { details } : {}) });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeZip(files) {
  const chunks = []; const central = []; let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name); const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    const crc = crc32(data); const header = Buffer.alloc(30 + name.length); header.writeUInt32LE(0x04034b50,0); header.writeUInt16LE(20,4); header.writeUInt16LE(0,6); header.writeUInt16LE(0,8); header.writeUInt16LE(0,10); header.writeUInt16LE(0,12); header.writeUInt32LE(crc,14); header.writeUInt32LE(data.length,18); header.writeUInt32LE(data.length,22); header.writeUInt16LE(name.length,26); header.writeUInt16LE(0,28); name.copy(header,30); chunks.push(header,data);
    const entry = Buffer.alloc(46 + name.length); entry.writeUInt32LE(0x02014b50,0); entry.writeUInt16LE(20,4); entry.writeUInt16LE(20,6); entry.writeUInt16LE(0,8); entry.writeUInt16LE(0,10); entry.writeUInt16LE(0,12); entry.writeUInt16LE(0,14); entry.writeUInt32LE(crc,16); entry.writeUInt32LE(data.length,20); entry.writeUInt32LE(data.length,24); entry.writeUInt16LE(name.length,28); entry.writeUInt16LE(0,30); entry.writeUInt16LE(0,32); entry.writeUInt16LE(0,34); entry.writeUInt16LE(0,36); entry.writeUInt32LE(0,38); entry.writeUInt32LE(offset,42); name.copy(entry,46); central.push(entry); offset += header.length + data.length;
  }
  const centralData = Buffer.concat(central); const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(files.length,8); end.writeUInt16LE(files.length,10); end.writeUInt32LE(centralData.length,12); end.writeUInt32LE(offset,16); return Buffer.concat([...chunks,centralData,end]);
}

function simplePdf(text) {
  const safe = text.replace(/[^\x20-\x7e\n]/g, '?').split('\n').slice(0, 45); const lines = ['BT','/F1 12 Tf','50 780 Td',...safe.flatMap((line, i) => [`(${line.replace(/[()\\]/g,'\\$&')}) Tj`, '0 -16 Td']), 'ET'].join('\n'); const objects = [`<< /Type /Catalog /Pages 2 0 R >>`,`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,`<< /Length ${Buffer.byteLength(lines)} >>\nstream\n${lines}\nendstream`]; let out='%PDF-1.4\n'; const offsets=[0]; objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(out));out+=`${i+1} 0 obj\n${obj}\nendobj\n`;}); const xref=Buffer.byteLength(out); out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(v=>String(v).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`; return Buffer.from(out);
}

function createExecutionRouter({ manager, faults }) {
  const router = express.Router();

  router.get('/catalog', (req, res) => res.json(getCatalog()));
  router.get('/targets', (req, res) => res.json({ targets: getCatalog().targets }));
  router.get('/tests', (req, res) => res.json({ tests: getCatalog().tests }));
  router.get('/faults', (req, res) => res.json(faults.get()));

  const setCartTotalFault = (req, res) => {
    try {
      return res.json(faults.setCartTotal(req.body && req.body.cartTotal ? req.body.cartTotal : req.body));
    } catch (error) {
      return jsonError(res, 400, error.message);
    }
  };
  router.post('/faults/local/cart-total', setCartTotalFault);
  router.put('/faults/local/cart-total', setCartTotalFault);

  router.get('/runs', (req, res) => res.json({ runs: manager.listRuns(req.query.limit) }));
  router.get('/history', (req, res) => res.json({ runs: manager.listRuns(req.query.limit) }));

  const startRun = async (req, res) => {
    try {
      const run = await manager.start(req.body || {});
      return res.status(202).json({ run });
    } catch (error) {
      return jsonError(res, error.statusCode || 400, error.message);
    }
  };
  router.post('/runs', startRun);
  router.post('/start', startRun);

  router.post('/runs/:runId/stop', async (req, res) => {
    const run = await manager.stop(req.params.runId);
    if (!run) return jsonError(res, 404, 'Run not found');
    return res.json({ run });
  });

  router.get('/runs/:runId/events', (req, res) => {
    const run = manager.getRun(req.params.runId);
    if (!run) return jsonError(res, 404, 'Run not found');

    const requestedSince = req.query.since || req.get('Last-Event-ID') || 0;
    const since = Number(requestedSince) || 0;
    res.status(200);
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    const write = event => {
      res.write(`id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    };
    const unsubscribe = manager.subscribe(req.params.runId, write);
    const replay = manager.getEvents(req.params.runId, since) || [];
    replay.forEach(write);
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 15000);
    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  router.get('/runs/:runId/artifacts/:name', (req, res) => {
    const artifact = manager.getRun(req.params.runId)?.artifacts.find(item => item.name === req.params.name);
    const artifactPath = manager.getArtifactPath(req.params.runId, req.params.name);
    if (!artifact || !artifactPath) return jsonError(res, 404, 'Artifact not found');
    // Express 5 on Windows: sendFile needs root option for absolute paths with drive letters
    const dir = path.dirname(artifactPath);
    const file = path.basename(artifactPath);
    res.type(artifact.contentType || path.extname(artifactPath));
    return res.sendFile(file, { root: dir });
  });

  router.get('/runs/:runId/report', (req, res) => {
    const run = manager.getRun(req.params.runId);
    if (!run) return jsonError(res, 404, 'Run not found');
    const assertions = run.events.filter(event => event.kind === 'assertion');
    const steps = run.events.filter(event => event.type === 'step.finished');
    const artifactLinks = run.artifacts.map(artifact => `<li><a href="${escapeHtml(artifact.url)}">${escapeHtml(artifact.name)}</a> (${escapeHtml(artifact.kind)})</li>`).join('') || '<li>No artifacts captured.</li>';
    const assertionRows = assertions.map(assertion => `<tr><td>${escapeHtml(assertion.name)}</td><td class="${escapeHtml(assertion.status)}">${escapeHtml(assertion.status)}</td><td>${escapeHtml(assertion.expected)}</td><td>${escapeHtml(assertion.actual)}</td></tr>`).join('') || '<tr><td colspan="4">No assertions recorded.</td></tr>';
    const stepRows = steps.map(step => `<li><strong>${escapeHtml(step.testId || '')} — ${escapeHtml(step.name)}</strong> — <span class="${escapeHtml(step.status)}">${escapeHtml(step.status)}</span></li>`).join('') || '<li>No steps recorded.</li>';
    const testRows = (run.tests || []).map(test => `<section><h2>${escapeHtml(test.name)}</h2><p>Status: <strong class="${escapeHtml(test.status)}">${escapeHtml(test.status)}</strong></p><p>Failure reason: ${escapeHtml(test.error?.message || 'None')}</p></section>`).join('');
    res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>TestSphere report ${escapeHtml(run.id)}</title><style>body{font-family:system-ui;background:#f7f7f4;color:#121212;max-width:1000px;margin:40px auto;padding:0 20px}section{background:#fff;border:1px solid #e4e3de;border-radius:12px;padding:20px;margin:16px 0}table{width:100%;border-collapse:collapse}td,th{padding:9px;border-bottom:1px solid #e4e3de;text-align:left}.passed{color:#168455}.failed{color:#c73d50}.cancelled{color:#a96d00}a{color:#c24c20}</style></head><body><h1>TestSphere 3D test report</h1><p>${escapeHtml(run.targetName)} · ${escapeHtml(run.browser)} · ${escapeHtml(run.startedAt || run.createdAt)}</p><section><h2>Summary</h2><p>Overall result: <strong class="${escapeHtml(run.status)}">${escapeHtml(run.status)}</strong></p><p>Run ID: ${escapeHtml(run.id)} · Total tests: ${escapeHtml(run.summary.total)} · Passed: ${escapeHtml(run.summary.passed)} · Failed: ${escapeHtml(run.summary.failed)} · Skipped: ${escapeHtml(run.summary.skipped)} · Duration: ${escapeHtml(run.durationMs == null ? 'in progress' : `${run.durationMs} ms`)}</p>${run.error ? `<p class="failed">Error: ${escapeHtml(run.error.message)}</p>` : ''}</section>${testRows}<section><h2>Test steps</h2><ol>${stepRows}</ol></section><section><h2>Assertions</h2><table><thead><tr><th>Test</th><th>Assertion</th><th>Status</th><th>Expected</th><th>Actual</th></tr></thead><tbody>${assertionRows}</tbody></table></section><section><h2>Evidence</h2><ul>${artifactLinks}</ul></section></body></html>`);
  });

  router.get('/runs/:runId/report.pdf', (req, res) => { const run = manager.getRun(req.params.runId); if (!run) return jsonError(res,404,'Run not found'); const text = [`TestSphere 3D test report`, `Run: ${run.id}`, `Website: ${run.targetName}`, `Browser: ${run.browser}`, `Result: ${run.status}`, `Tests: ${run.summary.total} total, ${run.summary.passed} passed, ${run.summary.failed} failed`, `Duration: ${run.durationMs ?? 'in progress'} ms`, '', ...(run.tests || []).map(t => `${t.name}: ${t.status}${t.error ? ` - ${t.error.message}` : ''}`)]; res.type('application/pdf').send(simplePdf(text.join('\n'))); });
  router.get('/runs/:runId/evidence.zip', (req, res) => { const run = manager.getRun(req.params.runId); if (!run) return jsonError(res,404,'Run not found'); const files = (run.artifacts || []).filter(a => a.kind === 'screenshot').map(a => ({ name: a.name, data: fs.readFileSync(manager.getArtifactPath(run.id,a.name)) })); if (!files.length) return jsonError(res,404,'No screenshots captured for this run'); res.type('application/zip').set('Content-Disposition', `attachment; filename="${run.id}-evidence.zip"`).send(makeZip(files)); });

  router.get('/runs/:runId', (req, res) => {
    const run = manager.getRun(req.params.runId);
    if (!run) return jsonError(res, 404, 'Run not found');
    return res.json({ run });
  });

  return router;
}

module.exports = { createExecutionRouter };
