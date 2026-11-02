# 🗓️ AgendaAO — Sistema de Agendamento para Angola

Sistema completo de agendamentos online para salões de beleza, barbearias e clínicas em Angola.
Pagamentos via **Multicaixa Express** e **transferência IBAN** bancária.

---

## 📁 Estrutura do projecto

```
agendaao/
├── backend/          ← API Node.js + Express + Prisma
│   ├── src/
│   │   ├── routes/   ← Todas as rotas da API
│   │   ├── middleware/
│   │   ├── services/ ← Crons, notificações
│   │   └── index.js  ← Servidor principal
│   ├── prisma/
│   │   └── schema.prisma ← Modelos da base de dados
│   └── .env.example  ← Variáveis de ambiente
└── frontend/         ← React + Vite + TailwindCSS
    └── src/
        ├── pages/    ← Todas as páginas
        ├── components/
        ├── store/    ← Zustand (auth global)
        └── services/ ← Axios
```

---

## 🚀 Instalação passo a passo

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+ (local ou Neon.tech gratuito)
- Git

---

### 1. Clonar e instalar dependências

```bash
# Instalar backend
cd backend
npm install

# Instalar frontend
cd ../frontend
npm install
```

---

### 2. Configurar variáveis de ambiente (backend)

```bash
cd backend
cp .env.example .env
# Abre .env no editor e preenche os valores
```

Variáveis **obrigatórias** para começar:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/agendaao"
JWT_SECRET="qualquer_string_longa_e_aleatoria_aqui"
```

---

### 3. Base de dados

```bash
cd backend

# Criar tabelas
npx prisma migrate dev --name init

# Gerar cliente Prisma
npx prisma generate

# (Opcional) Abrir painel visual da BD
npx prisma studio
```

---

### 4. Iniciar em desenvolvimento

Terminal 1 — Backend:
```bash
cd backend
npm run dev
# → http://localhost:4000
```

Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

---

## 💳 Integrar Multicaixa Express (produção)

### Passo 1 — Obter credenciais EMIS
1. Vai a **emis.co.ao** ou contacta o teu banco (BFA, BAI, BIC, BDA)
2. Pede acesso à API Multicaixa Express para comerciantes
3. Tens de ter: NIF da empresa + conta bancária angolana

### Passo 2 — Preencher .env
```env
EMIS_MERCHANT_ID=AO_MERCHANT_XXXXX
EMIS_TERMINAL_ID=TERM_XXXXX
EMIS_API_KEY=sk_live_xxxxxxxx
EMIS_WEBHOOK_SECRET=whsec_xxxxxxxx
EMIS_BASE_URL=https://api.multicaixa.ao/express/v1
```

### Passo 3 — Activar código de produção
No ficheiro `backend/src/routes/pagamentos.js`, na função `pagarExpress`:
- **Descomenta** o bloco `// PRODUÇÃO`
- **Remove** o bloco `// SIMULAÇÃO`

### Passo 4 — Configurar webhook no EMIS
URL do webhook que forneces ao EMIS:
```
https://teudominio.ao/api/pagamentos/webhook
```

---

## 📱 Integrar WhatsApp (Z-API — recomendado para Angola)

```bash
# Instalar cliente Z-API
npm install axios  # já instalado
```

No ficheiro `backend/src/services/cronService.js`, descomenta e implementa:
```js
await enviarWhatsApp(telefone, mensagem)
```

Cria a função:
```js
async function enviarWhatsApp(telefone, mensagem) {
  await axios.post(
    `${process.env.ZAPI_BASE_URL}/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-text`,
    { phone: telefone, message: mensagem }
  )
}
```

---

## 🌐 Deploy em produção (recomendado)

### Backend — Railway.app (gratuito para começar)
1. Cria conta em **railway.app**
2. Novo projecto → Deploy from GitHub
3. Adiciona as variáveis de ambiente no painel Railway
4. Railway cria o PostgreSQL automaticamente

### Frontend — Vercel (gratuito)
1. Cria conta em **vercel.com**
2. Import GitHub repo → selecciona pasta `frontend`
3. Adiciona variável: `VITE_API_URL=https://teu-backend.railway.app`
4. Em `frontend/src/services/api.js`, muda `baseURL` para `process.env.VITE_API_URL + '/api'`

### Domínio .ao
- Regista em **nic.ao** (domínio angolano)
- Aponta DNS para Vercel (frontend) e Railway (backend)

---

## 📱 Como os clientes acedem ao agendamento

Cada negócio tem um link único:
```
https://agendaao.ao/b/nome-do-salao-abc123
```

O dono partilha este link no:
- WhatsApp pessoal / grupo
- Instagram bio
- Facebook
- Impresso em cartão de visita como QR Code

---

## 💰 Planos e preços (configuráveis em `pagamentos.js`)

| Plano        | Preço/mês | Profissionais |
|-------------|-----------|---------------|
| Básico      | Grátis    | 1             |
| Profissional | 8.000 Kz | Até 5         |
| Premium     | 19.000 Kz | Ilimitado     |

---

## 🗂️ Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/registar` | Criar conta |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Utilizador actual |
| GET | `/api/agendamentos` | Listar agendamentos |
| POST | `/api/agendamentos` | Criar agendamento |
| PATCH | `/api/agendamentos/:id/status` | Actualizar estado |
| GET | `/api/clientes` | Listar clientes |
| POST | `/api/clientes` | Criar cliente |
| GET | `/api/servicos` | Listar serviços |
| POST | `/api/servicos` | Criar serviço |
| GET | `/api/profissionais` | Listar profissionais |
| GET | `/api/relatorios/dashboard` | Dados do dashboard |
| GET | `/api/relatorios/mensal` | Relatório mensal |
| POST | `/api/pagamentos/iniciar-express` | Pagar com Express |
| POST | `/api/pagamentos/iniciar-iban` | Gerar instrução IBAN |
| POST | `/api/pagamentos/webhook` | Webhook EMIS |
| GET | `/api/public/negocio/:slug` | Info pública do negócio |
| GET | `/api/public/negocio/:slug/disponibilidade` | Slots disponíveis |
| POST | `/api/public/negocio/:slug/agendar` | Criar agendamento público |

---

## 🔧 Suporte e customização

Para implementar as APIs reais:
1. `EMIS_API_KEY` — Multicaixa Express → emis.co.ao
2. `ZAPI_TOKEN` — WhatsApp → z-api.io
3. `DATABASE_URL` — PostgreSQL → neon.tech (gratuito)

---

**Construído com ❤️ para Angola**

## Login com Google (criação de conta)

1. No [Google Cloud Console](https://console.cloud.google.com) cria um projeto e, em *APIs e serviços → Credenciais*, um **ID do cliente OAuth** do tipo *Aplicação Web*.
2. Em *Origens JavaScript autorizadas* adiciona o endereço do site (ex.: `https://agenda-ao.vercel.app`).
3. Define `GOOGLE_CLIENT_ID` nas variáveis de ambiente do backend (Render).

Com `GOOGLE_CLIENT_ID` definido, as **contas novas só podem ser criadas com Google**. Contas antigas continuam a entrar com email e senha, ou com Google (ligadas pelo mesmo email). Sem a variável, o registo por email e senha continua a funcionar.

## Depoimentos

Depois de 10 dias de uso, o dono do negócio é convidado a deixar um depoimento (`/avaliar`). Os depoimentos aparecem na página inicial (um de cada vez) e em `/depoimentos`. O administrador pode esconder um depoimento com `PATCH /api/admin/depoimentos/:id` (`{ "visivel": false }`).
