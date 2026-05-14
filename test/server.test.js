// Minimal smoke tests using Node's built-in test runner (no test deps).
// Boots the app on an ephemeral port, hits the endpoints, asserts on the
// shape — enough to catch a typo break in CI without owning a test framework.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Force a known APP_VERSION before requiring the server.
process.env.APP_VERSION = 'test-1.2.3';
process.env.PORT = '0'; // ask the OS for a free port

// server.js calls app.listen() at require time — we capture the server below.
const express = require('express');
const realListen = express.application.listen;
let captured;
express.application.listen = function patched(...args) {
  captured = realListen.apply(this, args);
  return captured;
};

require('../server.js');

function get(path) {
  return new Promise((resolve, reject) => {
    const { port } = captured.address();
    http.get({ host: '127.0.0.1', port, path }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

test('GET /health returns 200 ok', async () => {
  const r = await get('/health');
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(r.body), { status: 'ok' });
});

test('GET /version returns the injected APP_VERSION', async () => {
  const r = await get('/version');
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(r.body), { version: 'test-1.2.3' });
});

test('GET / returns plain text containing the version', async () => {
  const r = await get('/');
  assert.equal(r.status, 200);
  assert.match(r.body, /cloudfide-demo-api test-1\.2\.3/);
});

test.after(() => { captured.close(); });
