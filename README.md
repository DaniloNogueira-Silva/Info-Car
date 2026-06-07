# 🚗 Gestão de Frota (info-car)

Bem-vindo ao **info-car**, uma API REST robusta para gestão de frota veicular construída com **NestJS**, focada em escalabilidade e separação de responsabilidades (Clean Architecture e DDD).

O sistema foi construído como um **Monorepo** contendo duas aplicações principais que operam juntas:
- **`api`**: A porta de entrada HTTP. Responsável por receber requisições, validar dados e interagir com o banco de dados principal (SQL Server).
- **`worker`**: O microsserviço assíncrono. Consome eventos de uma fila do RabbitMQ (ex: quando um veículo é criado/alterado) para gerar logs de auditoria no MongoDB e invalidar o cache no Redis.

Essa separação garante que o processamento pesado não afete o tempo de resposta da API!

---

## 🚀 Passo a Passo: Como Rodar no Docker

A maneira mais fácil e recomendada de subir o projeto é orquestrando tudo via Docker Compose. Os containers irão iniciar tanto as aplicações (`api` e `worker`) quanto as infraestruturas necessárias (SQL Server, MongoDB, Redis, RabbitMQ).

### 1. Preparar o Ambiente

Primeiro, instale as dependências locais (necessário para rodar os testes e o seeder posteriormente):
```bash
npm i
```

Copie o arquivo de variáveis de ambiente de exemplo:
```bash
cp .env.example .env
```

### 2. Subir a Infraestrutura e as Aplicações

Suba os containers executando o comando abaixo. Ele fará o build da `api` e do `worker` e iniciará os bancos de dados:
```bash
docker compose up -d --build
```

### 3. Rodar o Seeder (Banco de Dados Inicial)

Para que você possa testar a aplicação imediatamente, criei um script de *seeder* que insere dados fictícios no banco, incluindo um usuário administrador padrão e alguns veículos.

Execute:
```bash
npm run seed
```

**Usuário Padrão Criado pelo Seeder:**
- **Email:** `admin@infocar.com`
- **Senha:** `Admin@123`
*(Você usará essas credenciais para gerar seu token JWT nas requisições protegidas)*

### 4. Executando os Testes de Cobertura

O projeto possui uma malha rigorosa de testes automatizados unitários, de integração e ponta-a-ponta (E2E).

Para rodar todos os testes e visualizar o relatório de cobertura:
```bash
npm run test:cov
```

---

## 📈 Teste de Carga e Rate Limiting (K6)

Eu incluí um script especializado para realizar testes de carga na API (`load-test.js`), simulando múltiplos usuários acessando simultaneamente as buscas paginadas e validando a performance do nosso Cache Redis.

A aplicação, no entanto, possui um mecanismo de segurança (**Rate Limit**) para evitar abusos no ambiente de produção, atualmente fixado em **100 requisições por minuto por IP**. 

Para conseguir rodar o teste de carga **sem ser bloqueado** (recebendo erros HTTP `429 Too Many Requests`), você deve primeiro aumentar os limites no seu arquivo `.env`:

1. Abra o arquivo `.env`
2. Configure valores altos para estressar a API:
   ```env
   THROTTLE_TTL=60000
   THROTTLE_LIMIT=1000000
   ```
3. Reinicie a API (`docker compose restart api`)
4. Por fim, rode o teste de carga:
   ```bash
   k6 run load-test.js
   ```

O teste K6 subirá a carga até 200 Usuários Virtuais simultâneos e emitirá um relatório final no seu terminal.

---

## 📚 Documentação (Swagger)

A API possui sua documentação interativa oficial servida em tempo real. Com os containers rodando, você pode acessá-la em:

👉 **[http://localhost:3000/docs](http://localhost:3000/docs)**

Lá você encontra todos os endpoints detalhados (`/brands`, `/models`, `/vehicles`, `/auth`), esquemas de corpo das requisições e poderá interagir diretamente com o sistema.

> **Nota:** As rotas de criação/edição e as listagens exigem o token JWT de autorização (obtido através da rota `/api/v1/auth/login`).
