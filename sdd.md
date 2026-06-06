# Documento de Especificação Arquitetural (SDD) - Gestão de Frota info-car

## 1. Visão Geral e Arquitetura

O sistema será construído utilizando os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**. O objetivo é isolar a regra de negócio (Domínio) da infraestrutura e dos frameworks (Aplicação/Adapters), garantindo baixo acoplamento e alta coesão.

* **Padrão de Projeto:** Ports and Adapters (Hexagonal Architecture).
* **Estrutura NestJS:** Utilização do modo apps (api e worker), separando os módulos por contexto delimitado (Bounded Contexts): `Identity`, `Fleet`, e `Telemetry`.

## 2. Stack Tecnológica Base

* 
**Core:** Node.js (18+) e NestJS (10+).


* 
**Banco de Dados Relacional:** SQL Server via TypeORM  (Para dados transacionais e de domínio).


* 
**Banco de Dados NoSQL:** MongoDB (Para logs de auditoria e time-series da telemetria).


* 
**Cache:** Redis  (Obrigatório para otimização de leitura) .


* 
**Mensageria:** RabbitMQ  (Comunicação assíncrona, invalidação de cache e buffer de telemetria).


* 
**Testes:** Jest  e K6 (Load Testing).


* **Observabilidade:** Prometheus + Grafana.

## 3. Diretrizes de Engenharia e Padrões

### 3.1. Estrutura de Diretórios (Por Módulo)

A separação rigorosa entre domínio e aplicação deve seguir:

* `domain/`: Entidades puras, Interfaces de Repositório (Ports), Exceptions de domínio. *Zero dependência do NestJS ou TypeORM.*
* `application/`: Casos de Uso (Use Cases/Services), DTOs de entrada/saída.
* `infrastructure/`: Implementação de Repositórios (Adapters do TypeORM/Mongo), Filas (RabbitMQ), Cache (Redis).
* `presentation/`: Controllers (REST), WebSockets (Gateways), Consumers (RabbitMQ).

### 3.2. Tratamento de Erros e Logs

* **Global Exception Filter:** Captura todos os erros e retorna um payload padronizado:
```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "A placa informada já existe.",
  "timestamp": "2026-06-05T12:00:00Z",
  "path": "/api/v1/vehicles"
}

```


* **Logs (Pino / NestJS Logger):** Utilizar logs formatados em JSON em produção.
* *Níveis:* `error` (exceções), `warn` (regras de negócio violadas), `info` (mudanças de estado importantes), `debug` (APIs e queries lentas). Sem poluição visual (evitar logar o corpo inteiro das requisições, exceto IDs).



### 3.3. Segurança

* **Rate Limiting:** Implementado com `@nestjs/throttler` para evitar brute-force (ex: máx. 100 requisições por minuto por IP).
* **Proteção de Headers:** Uso do `helmet` para ocultar a stack e mitigar XSS/Clickjacking.
* 
**Autenticação:** JWT obrigatório (`@nestjs/jwt` e `passport-jwt`) para todas as rotas (exceto `/health` e `/metrics`).



## 4. Modelagem de Dados e Performance

### 4.1. Entidades (SQL Server)

Todas as tabelas devem conter os metadados obrigatórios: `created_at`, `updated_at`, `created_by` .

* 
**`users`:** `id`, `nickname`, `name`, `email` .


* 
**`brands`:** `id`, `name` . Relacionamento 1:N com Models.


* 
**`models`:** `id`, `name`, `brand_id` (FK) .


* 
**`vehicles`:** `id`, `license_plate`, `chassis`, `renavam`, `year`, `model_id` (FK) .



*Otimização:* Índices (B-Tree) obrigatórios nas colunas `license_plate`, `chassis` e `renavam` para performance máxima em consultas e validações de unicidade.

### 4.2. Fluxo de Cache (Redis)

* 
**Regra:** Consultas de listagem (`GET /vehicles`) e busca por ID batem primeiro no Redis.


* 
**Invalidação:** Operações de Mutação (`POST`, `PUT`, `DELETE` em `vehicles`)  não limpam o cache diretamente. Elas emitem um evento `vehicle.mutated` no RabbitMQ. Um Consumer assíncrono limpa as chaves afetadas para garantir tempos de resposta (latência) < 50ms na API.



5. Estratégia de Testes (Cobertura > 90%) 

O padrão **AAA (Arrange, Act, Assert)** é mandatório em todos os testes.

* 
**Unitários (Jest):** Foco na camada `application` (Use Cases). Repositórios e dependências externas devem ser *mockados* usando `jest.mock` ou interfaces providas dinamicamente. Validações de domínio devem ser testadas exaustivamente.


* **Integração (Jest + Testcontainers):** Foco em `infrastructure`. Testar se o TypeORM realmente salva no banco, se a constraint de UNIQUE falha corretamente no SQL Server, e se o cache grava no Redis.
* **E2E (Jest + Supertest):** Foco em `presentation`. Chamar a rota `POST /vehicles`, verificar se o HTTP Status é 201 e se o Redis foi atualizado.
* **Teste de Carga (K6):** Script simples `.js` disparando 500 VUs (Virtual Users) contra `GET /vehicles` para provar a eficácia do cache e da paginação.

## 6. Documentação (Swagger)

* Integrado via `@nestjs/swagger`.
* Anotações detalhadas nos DTOs (`@ApiProperty`) demonstrando exemplos (ex: Placa "ABC-1234").
* Agrupamento por tags (`@ApiTags('Vehicles', 'Models', 'Telemetry')`).
* Definição de segurança (`@ApiBearerAuth()`) para testar o JWT direto pela UI.

## 7. Observabilidade e Telemetria

* **Prometheus:** Expor rota `/metrics` utilizando `@willsoto/nestjs-prometheus`.
* **Métricas Coletadas:**
* Latência das requisições HTTP (Histogram).
* Taxa de erros HTTP 4xx e 5xx (Counter).
* Tamanho das filas do RabbitMQ.


* **Grafana:** Fornecer um arquivo `dashboard.json` pré-configurado no repositório para ser importado, mostrando a saúde da frota e do sistema.

8. Infraestrutura e Docker 

### 8.1. Dockerfile (API)

* 
**Multistage Build**:


1. `builder`: Instala dependências (incluindo devDependencies) e compila o TS (`npm run build`).
2. `production`: Imagem base minimalista (`node:18-alpine`), copia apenas a pasta `/dist`, `package.json` e instala apenas `--omit=dev`.



### 8.2. 

Docker Compose (`docker-compose.yml`) 

* **Serviços:** `api`, `sqlserver`, `redis`, `rabbitmq`, `mongodb`, `prometheus`, `grafana`.
* **Healthchecks:** Garantir que a `api` só inicie após o banco de dados estar "healthy".
* **Volumes:** Persistência de dados para SQL Server e MongoDB.
* 
**Seed:** Script `entrypoint.sh` ou funcionalidade na inicialização do NestJS que injeta os dados do arquivo obrigatório `seed_vehicles.json` e cria o usuário padrão `info-car` automaticamente.



## 9. Funcionalidade Diferencial: Simulador de Telemetria (IoT)

Como prova da proficiência em microsserviços:

1. Endpoint `POST /telemetry/simulate` recebe origem e destino.
2. O sistema interpola coordenadas geográficas e publica N mensagens por segundo no RabbitMQ (`exchange: fleet.events`, `routingKey: telemetry.location`).
3. Um `TelemetryWorker` consome a fila:
* Salva o ponto geográfico no MongoDB (Auditoria/Time-series).
* Atualiza o status "Última Posição" no Cache do Redis.



---