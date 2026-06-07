# 🚗 Gestão de Frota info-car

API REST para gestão de frota veicular construída com **Clean Architecture**, **DDD** e **NestJS**, utilizando estrutura **Monorepo** com apps separados (`api` e `worker`).

---

## 📐 Arquitetura

### Decisão: Monorepo com Apps Separados

O projeto utiliza a estrutura **monorepo do NestJS** com dois aplicativos independentes: **`api`** e **`worker`**. Essa decisão arquitetural foi tomada para garantir:

- **Resiliência:** Se o worker (que processa eventos do RabbitMQ) falhar ou sofrer alta carga, a API REST continua operando normalmente, respondendo requisições HTTP sem degradação. Os dois processos são isolados — cada um tem seu próprio container Docker, podendo ser reiniciado, escalado ou depurado independentemente.

- **Escalabilidade independente:** Em cenários de pico, é possível escalar apenas o worker (ex: `docker compose up --scale worker=3`) para processar a fila mais rápido, sem instanciar novas réplicas da API desnecessariamente.

- **Separação de responsabilidades:** A `api` é responsável exclusivamente pelo ciclo HTTP (receber requisições, validar DTOs, retornar respostas). O `worker` é responsável pelo processamento assíncrono (auditoria no MongoDB, invalidação de cache no Redis). Essa separação segue o princípio de responsabilidade única em nível de processo.

- **Código compartilhado via `libs/shared`:** Entidades de domínio, DTOs, interfaces de repositório e constantes são compartilhados entre os dois apps via a biblioteca `@app/shared`, evitando duplicação.

### Diagrama de Fluxo

```
┌──────────────┐     HTTP      ┌──────────────┐     RabbitMQ     ┌──────────────┐
│   Cliente    │ ──────────▶  │     API       │ ──────────────▶  │    Worker    │
│  (Browser /  │               │  (NestJS)    │                  │  (NestJS)    │
│   Swagger)   │               │              │                  │              │
└──────────────┘               │  ┌────────┐  │                  │  ┌────────┐  │
                               │  │SQL Srv │  │                  │  │MongoDB │  │
                               │  └────────┘  │                  │  └────────┘  │
                               │  ┌────────┐  │                  │  ┌────────┐  │
                               │  │ Redis  │◄─┼──────────────────┼─▶│ Redis  │  │
                               │  └────────┘  │   Invalidação    │  └────────┘  │
                               └──────────────┘                  └──────────────┘
```

### Stack Tecnológica

| Componente | Tecnologia |
|------------|-----------|
| Core | Node.js 20+ / NestJS 11 |
| Banco Relacional | SQL Server (TypeORM) |
| Banco NoSQL | MongoDB (Mongoose) |
| Cache | Redis (cache-manager-redis-yet) |
| Mensageria | RabbitMQ (AMQP) |
| Autenticação | JWT (Passport) |
| Rate Limiting | @nestjs/throttler |
| Proteção HTTP | Helmet |
| Observabilidade | Prometheus + Grafana |
| Testes | Jest + K6 |
| Containerização | Docker + Docker Compose |

---

## 📁 Estrutura de Diretórios

```
.
├── apps/
│   ├── api/                    # App HTTP (REST API)
│   │   └── src/
│   │       ├── auth/           # JWT, guards, decorators
│   │       ├── brands/         # Módulo de marcas (DDD)
│   │       ├── models/         # Módulo de modelos (DDD)
│   │       ├── vehicles/       # Módulo de veículos (DDD)
│   │       ├── common/         # Filtros globais
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── worker/                 # App de microsserviço (RabbitMQ)
│       └── src/
│           ├── consumers/      # Consumers de eventos
│           ├── services/       # AuditService, CacheService
│           ├── schemas/        # Schemas Mongoose
│           └── worker.module.ts
├── libs/
│   └── shared/                 # Biblioteca compartilhada
│       └── src/
│           ├── domain/         # Entidades de domínio (zero deps)
│           ├── ports/          # Interfaces de repositório
│           ├── dtos/           # DTOs de entrada/saída
│           └── constants/      # Constantes (RabbitMQ, etc.)
├── docker-compose.yml
├── Dockerfile.api
├── Dockerfile.worker
├── load-test.js                # Script K6 de carga
└── package.json
```

Cada módulo de negócio segue a estrutura **Ports & Adapters**:
```
module/
├── application/      # Use Cases (Services)
├── infrastructure/   # Adapters (TypeORM entities, repositories)
└── presentation/     # Controllers (REST)
```

---

## 🚀 Início Rápido

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/) instalados
- [Node.js 20+](https://nodejs.org/) (apenas para desenvolvimento local)
- [K6](https://k6.io/docs/getting-started/installation/) (opcional, para testes de carga)

### 1. Clonar o repositório

```bash
git clone https://github.com/DaniloNogueira-Silva/teste.git
cd teste
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` conforme necessário. As variáveis principais são:

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DB_HOST` | Host do SQL Server | `sqlserver` |
| `DATABASE_PORT` | Porta do SQL Server | `1433` |
| `DB_USERNAME` | Usuário do banco | `sa` |
| `DB_PASSWORD` | Senha do banco | `YourStrong!Passw0rd` |
| `DB_DATABASE` | Nome do banco | `info-car` |
| `RABBITMQ_URL` | URL de conexão RabbitMQ | `amqp://guest:guest@rabbitmq:5672` |
| `REDIS_HOST` | Host do Redis | `redis` |
| `REDIS_PORT` | Porta do Redis | `6379` |
| `CACHE_TTL` | TTL do cache em segundos | `60` |
| `MONGODB_URI` | URI de conexão MongoDB | `mongodb://mongodb:27017/info-car` |
| `API_PORT` | Porta da API | `3000` |
| `JWT_SECRET` | Segredo para assinatura JWT | — |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `1h` |
| `AUTH_DEFAULT_PASSWORD` | Senha padrão para login | `Admin@123` |

### 3. Subir com Docker Compose

```bash
docker compose up -d
```

Isso irá orquestrar **7 serviços**:

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `api` | `3000` | API REST (NestJS) |
| `worker` | — | Microsserviço consumer (RabbitMQ) |
| `sqlserver` | `1433` | Banco de dados relacional |
| `redis` | `6379` | Cache |
| `rabbitmq` | `5672` / `15672` | Mensageria (Management UI em `:15672`) |
| `mongodb` | `27017` | Banco NoSQL (auditoria) |
| `sqlserver-init` | — | Inicializa o banco `info-car` |

> **Ordem de inicialização:** O Docker Compose garante que a `api` só inicia após o SQL Server estar healthy e o banco `info-car` ter sido criado. O `worker` só inicia após o RabbitMQ estar healthy.

### 4. Acessar a aplicação

| Recurso | URL |
|---------|-----|
| API REST | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/docs |
| RabbitMQ Management | http://localhost:15672 (guest/guest) |

### 5. Parar os serviços

```bash
docker compose down
```

Para remover também os volumes (dados persistidos):
```bash
docker compose down -v
```

---

## 🔐 Segurança

### Autenticação JWT

Todas as rotas de negócio exigem autenticação via **Bearer Token JWT**.

**Obter token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@infocar.com", "password": "Admin@123"}'
```

**Usar token:**
```bash
curl http://localhost:3000/api/v1/vehicles \
  -H "Authorization: Bearer <seu_token>"
```

**Rotas públicas (sem JWT):**
- `POST /api/v1/auth/login` — Login
- `GET /api/v1` — Health check
- `GET /docs` — Swagger UI

### Rate Limiting

Limite de **100 requisições por minuto por IP** via `@nestjs/throttler`. Ao exceder, retorna `429 Too Many Requests`.

### Helmet

Headers HTTP endurecidos automaticamente (XSS protection, Content-Type sniffing, etc.).

### Payload de Erro Padronizado

Todos os erros seguem o formato:
```json
{
  "statusCode": 400,
  "code": "BAD_REQUEST",
  "message": "A placa informada já existe.",
  "timestamp": "2026-06-06T12:00:00.000Z",
  "path": "/api/v1/vehicles"
}
```

---

## 🧪 Testes

### Testes Unitários e de Integração (Jest)

```bash
# Todos os testes
npm test

# Com cobertura
npm run test:cov

# Apenas testes da API
npx jest apps/api

# Apenas testes do worker
npx jest apps/worker
```

**Cobertura de testes:**

| Categoria | Suites | Testes |
|-----------|--------|--------|
| Unit — API Use Cases | 3 | 32 |
| Integration — Persistência | 3 | 22 |
| Unit — Worker Consumers | 3 | 20 |
| **Total** | **11** | **74** |

### Teste de Carga (K6)

Simula **500 Virtual Users** acessando `GET /api/v1/vehicles`:

```bash
# Teste padrão
k6 run load-test.js

# Apontar para outro host
k6 run --env BASE_URL=http://api:3000 load-test.js
```

**Estágios do teste:**
1. Ramp-up para 100 VUs (30s)
2. Ramp-up para 500 VUs (1min)
3. Sustenta 500 VUs (2min)
4. Ramp-down (30s)

**Thresholds:**
- P95 latência < 500ms
- Taxa de erro < 5%

---

## 📋 Endpoints da API

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/v1/auth/login` | Autenticar e obter JWT | ❌ |
| `POST` | `/api/v1/auth/register` | Cadastrar novo usuário | ✅ |
| `GET` | `/api/v1` | Health check | ❌ |
| `GET` | `/api/v1/brands` | Listar marcas (Paginado) | ✅ |
| `GET` | `/api/v1/brands/:id` | Buscar marca por ID | ✅ |
| `POST` | `/api/v1/brands` | Criar marca | ✅ |
| `PUT` | `/api/v1/brands/:id` | Atualizar marca | ✅ |
| `DELETE` | `/api/v1/brands/:id` | Remover marca | ✅ |
| `GET` | `/api/v1/models` | Listar modelos (Paginado) | ✅ |
| `GET` | `/api/v1/models/:id` | Buscar modelo por ID | ✅ |
| `POST` | `/api/v1/models` | Criar modelo | ✅ |
| `PUT` | `/api/v1/models/:id` | Atualizar modelo | ✅ |
| `DELETE` | `/api/v1/models/:id` | Remover modelo | ✅ |
| `GET` | `/api/v1/vehicles` | Listar veículos (Paginado, com cache) | ✅ |
| `GET` | `/api/v1/vehicles/:id` | Buscar veículo por ID (com cache) | ✅ |
| `POST` | `/api/v1/vehicles` | Criar veículo | ✅ |
| `PUT` | `/api/v1/vehicles/:id` | Atualizar veículo | ✅ |
| `DELETE` | `/api/v1/vehicles/:id` | Remover veículo | ✅ |

> Documentação interativa completa disponível em `/docs` (Swagger UI).

---

## 🛠 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Subir apenas a infraestrutura (sem os apps)
docker compose up -d

# Rodar a API em modo dev
npm run start:dev api

# Rodar o worker em modo dev
npm run start:dev worker

# Build de produção
npm run build
```

---

## 📝 Licença

UNLICENSED — Projeto privado.
