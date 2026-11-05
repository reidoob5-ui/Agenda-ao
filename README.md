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

| | Básico (grátis) | Profissional (8.000 Kz) | Premium (19.000 Kz) |
|---|---|---|---|
| Profissionais | 1 | até 5 | ilimitados |
| Marcações/mês | 50 | ilimitadas | ilimitadas |
| Página de marcação + QR | sim (com "Feito com AgendaAO") | + logotipo próprio | + cor própria, sem marca AgendaAO |
| Clientes | lista simples | CRM (ficha + histórico) | + pontos de fidelidade |
| Lembretes | botão WhatsApp manual | email ao cliente | WhatsApp automático (Meta) |
| Relatórios | resumo do dia | financeiros mensais | + avançados (por profissional, horas de pico, clientes que não voltam) |
| Lista de espera | — | — | sim |
| Suporte | normal | normal | prioritário |

**Onde mudar quem tem o quê:** `backend/src/utils/planos.js` (o servidor bloqueia de verdade, devolve 403 `PLANO_INSUFICIENTE`) e o espelho `frontend/src/utils/planos.js` (só decide o que mostrar). Limites numéricos (50 marcações, 1/5 profissionais) estão em `backend/src/utils/agenda.js`.

Marca da empresa: o logotipo está em `frontend/public/ada-lovelace-logo.png` e o texto/email em `frontend/src/utils/marca.js`. O email de suporte pode ser trocado com `VITE_SUPORTE_EMAIL` (Vercel) e `EMAIL_SUPORTE` (Render, para os emails enviados).

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

## WhatsApp automático (Meta Cloud API)

Confirmação e lembretes (24h e 2h antes) por WhatsApp. Só envia para os planos em `WHATSAPP_PLANOS` (por defeito Premium) e respeita o limite `WHATSAPP_LIMITE_MES` por negócio.

1. Em `business.facebook.com` cria/verifica a conta do negócio. Em `developers.facebook.com` cria uma app do tipo *Business* e adiciona o produto **WhatsApp**.
2. Em *WhatsApp → API Setup* copia o **Phone Number ID** e gera um **token permanente** (utilizador do sistema).
3. No Render define `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID`.
4. Em *Message Templates* cria 2 modelos de categoria **Utility**, idioma **Portuguese (PT)**, com estes nomes e textos:
   - `confirmacao_marcacao`: `Olá {{1}}! A tua marcação está confirmada: {{2}} em {{3}}, no dia {{4}} às {{5}}. Até já!`
   - `lembrete_marcacao`: `Olá {{1}}! Lembrete da tua marcação: {{2}} em {{3}}, no dia {{4}} às {{5}}. Até já!`
5. No painel de administração (`Dashboard`), usa **1. Testar ligação** e depois **2. Testar modelo de confirmação**.

As mensagens enviadas ficam registadas na tabela `mensagens_whatsapp`.

## 🌍 Versão global (Ada Lovelace Technologies)

- **Idiomas**: português, inglês, espanhol e francês. A página escolhe pelo idioma do navegador (ou pelo idioma do negócio) e o visitante troca quando quiser.
- **Fuso horário**: cada negócio tem o seu (`Negocio.fusoHorario`). Os horários são sempre os do negócio; o cliente vê também a hora no fuso dele.
- **Moeda**: AOA, USD, EUR, BRL, GBP, MZN, CVE, ZAR, MXN, CAD (`Negocio.moeda`). Preços dos planos em `backend/src/utils/planos.js` (`PRECOS`) e `frontend/src/utils/planos.js` — são valores por defeito, ajusta-os.
- **Consultas online**: marca um serviço como "Sessão online". Ao confirmar, o cliente recebe o link (sala Jitsi grátis ou o link fixo do negócio) por email e na página.
- **Pix (Brasil)**: negócios em BRL com `chavePix` mostram QR code/copia-e-cola com o valor. O pagamento vai direto ao negócio.

### Pagamentos internacionais dos planos (Paddle)
Paddle é o "merchant of record": cobra cartão, PayPal, Apple/Google Pay e **Pix (clientes brasileiros)** e paga à Ada Lovelace. Angola continua com Multicaixa Express/IBAN (manual).

1. Criar conta em paddle.com (precisa de aprovação) e, primeiro, testar no **sandbox**.
2. Em Paddle → Checkout settings: aprovar o domínio do frontend e definir o *default payment link* `https://SEU-FRONTEND/pagar`.
3. Notifications → webhook para `https://SEU-BACKEND/api/webhooks/paddle` com o evento `transaction.completed`.
4. **Render** (backend): `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_ENV=sandbox|live`, `FRONTEND_URL`.
5. **Vercel** (frontend): `VITE_PADDLE_CLIENT_TOKEN` (token do cliente, público) e `VITE_PADDLE_ENV=sandbox|live`.
6. A Paddle exige páginas de Termos e Privacidade no site.

Nunca coloques chaves no código nem no chat — só nas variáveis de ambiente.

### WhatsApp em vários idiomas
Cada idioma precisa do seu modelo aprovado na Meta: `WHATSAPP_IDIOMA_PT/EN/ES/FR`.
