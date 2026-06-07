/**
 * K6 Load Test — Endpoints de Busca Paginados
 *
 * Simula Virtual Users (VUs) acessando as listagens de marcas,
 * modelos e veículos (com paginação e filtros) para validar a eficácia 
 * do cache Redis, paginação e a estabilidade da API.
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
const brandsLatency = new Trend('brands_search_latency', true);
const modelsLatency = new Trend('models_search_latency', true);
const vehiclesLatency = new Trend('vehicles_search_latency', true);

// ── Configuração ───────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 50 },    // ramp-up para 50 VUs
    { duration: '1m',  target: 200 },   // ramp-up para 200 VUs
    { duration: '1m',  target: 200 },   // sustenta 200 VUs
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
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: 'aivacol@example.com',
      password: 'aivacol',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const token = loginRes.json('access_token');
  if (!token) {
    console.error(`Login failed: ${loginRes.status} ${loginRes.body}`);
  }

  return { token };
}

// ── Cenário principal ──────────────────────────────────────────
export default function (data) {
  if (!data.token) {
    console.error('No token available, skipping iteration');
    sleep(1);
    return;
  }

  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Parâmetros aleatórios de paginação para variar os cenários
  const page = Math.floor(Math.random() * 3) + 1; // páginas 1 a 3
  const limit = 10;

  // 1. Busca de Marcas
  const resBrands = http.get(`${BASE_URL}/api/v1/brands?page=${page}&limit=${limit}`, { headers });
  brandsLatency.add(resBrands.timings.duration);
  errorRate.add(resBrands.status !== 200);

  check(resBrands, {
    'brands status is 200': (r) => r.status === 200,
    'brands response is paginated': (r) => r.json('data') !== undefined,
  });

  sleep(Math.random() * 1 + 0.5); // think time

  // 2. Busca de Modelos com Filtro
  const resModels = http.get(`${BASE_URL}/api/v1/models?page=1&limit=${limit}&filter=a`, { headers });
  modelsLatency.add(resModels.timings.duration);
  errorRate.add(resModels.status !== 200);

  check(resModels, {
    'models status is 200': (r) => r.status === 200,
    'models response is paginated': (r) => r.json('data') !== undefined,
  });

  sleep(Math.random() * 1 + 0.5);

  // 3. Busca de Veículos (Cacheado)
  const resVehicles = http.get(`${BASE_URL}/api/v1/vehicles?page=${page}&limit=${limit}`, { headers });
  vehiclesLatency.add(resVehicles.timings.duration);
  errorRate.add(resVehicles.status !== 200);

  check(resVehicles, {
    'vehicles status is 200': (r) => r.status === 200,
    'vehicles response is paginated': (r) => r.json('data') !== undefined,
    'vehicles latency < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(Math.random() * 2 + 0.5);
}
