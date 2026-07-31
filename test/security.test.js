import test from 'node:test';
import assert from 'node:assert/strict';

import { generateToken, checkToken } from '../src/middleware/auth.js';
import { extractWebSocketToken } from '../src/handlers/update.js';
import { secureCompare } from '../src/utils/security.js';

const env = { API_SECRET: 'agent-secret-for-tests' };
const settings = { jwt_secret: 'jwt-secret-for-tests-at-least-32-characters' };

test('secureCompare accepts only the matching non-empty secret', async () => {
  assert.equal(await secureCompare('same-secret', 'same-secret'), true);
  assert.equal(await secureCompare('wrong-secret', 'same-secret'), false);
  assert.equal(await secureCompare('', ''), false);
  assert.equal(await secureCompare(undefined, 'same-secret'), false);
});

test('WebSocket token is extracted only from the authenticated subprotocol', async () => {
  const token = await generateToken(env, settings);
  const request = new Request('https://monitor.example.test/api/ws', {
    headers: {
      'Sec-WebSocket-Protocol': `cfsm, cfsm.jwt.${token}`
    }
  });

  assert.equal(extractWebSocketToken(request), token);
  assert.equal(await checkToken(token, env, settings), true);
});

test('WebSocket token extraction rejects missing and malformed protocols', () => {
  const missingBaseProtocol = new Request('https://monitor.example.test/api/ws', {
    headers: { 'Sec-WebSocket-Protocol': 'cfsm.jwt.invalid.token.value' }
  });
  const malformedToken = new Request('https://monitor.example.test/api/ws', {
    headers: { 'Sec-WebSocket-Protocol': 'cfsm, cfsm.jwt.not-a-jwt' }
  });

  assert.equal(extractWebSocketToken(missingBaseProtocol), '');
  assert.equal(extractWebSocketToken(malformedToken), '');
});
