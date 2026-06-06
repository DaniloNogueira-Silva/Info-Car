/**
 * K6 Load Test — GET /api/v1/vehicles
 *
 * Simula 500 Virtual Users (VUs) acessando a listagem de veículos
 * para validar a eficácia do cache Redis e a estabilidade da API.
 *
 * Uso:
 *   k6 run load-test.js
 *   k6 run --env BASE_URL=http://api:3000 load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Métricas customizadas ──────────────────────────────────────
const errorRate = new Rate('errors');
const vehiclesLatency = new Trend('vehicles_latency', true);

// ── Configuração ───────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 100 },   // ramp-up para 100 VUs
    { duration: '1m',  target: 500 },   // ramp-up para 500 VUs
    { duration: '2m',  target: 500 },   // sustenta 500 VUs por 2 min
    { duration: '30s', target: 0 },     // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],    // 95% das requests < 500ms
    errors: ['rate<0.05'],               // taxa de erro < 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// ── Setup: obter JWT para autenticação ─────────────────────────
export function setup() {
  // const loginRes = http.post(
  //   `${BASE_URL}/api/v1/auth/login`,
  //   JSON.stringify({
  //     email: 'loadtest@infocar.com',
  //     password: __ENV.AUTH_PASSWORD || 'Admin@123',
  //   }),
  //   { headers: { 'Content-Type': 'application/json' } },
  // );

  // const token = loginRes.json('access_token');
  // if (!token) {
  //   console.error(`Login failed: ${loginRes.status} ${loginRes.body}`);
  // }

  // return { token };
}

// ── Cenário principal ──────────────────────────────────────────
export default function (data) {
  const headers = {
    // Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  const res = http.get(`${BASE_URL}/api/v1/vehicles`, { headers });

  // Registrar métricas
  vehiclesLatency.add(res.timings.duration);
  errorRate.add(res.status !== 200);

  // Validações
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response is array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
    'latency < 500ms': (r) => r.timings.duration < 500,
  });

  // Simular think time entre requisições
  sleep(Math.random() * 2 + 0.5);
}
