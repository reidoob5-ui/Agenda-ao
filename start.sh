#!/bin/bash
# ============================================================
# AgendaAO — Script de arranque rápido
# Corre: chmod +x start.sh && ./start.sh
# ============================================================

echo ""
echo "╔═══════════════════════════════════╗"
echo "║       AgendaAO — Arranque         ║"
echo "╚═══════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado. Instala em https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Precisas de Node.js 18+. Versão actual: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar dependências backend
echo ""
echo "📦 A instalar dependências do backend..."
cd backend
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "📝 Ficheiro .env criado — edita backend/.env antes de continuar"
  echo "   Mínimo necessário: DATABASE_URL e JWT_SECRET"
  echo ""
  read -p "Prima ENTER depois de editar o .env..."
fi
npm install --silent
echo "✅ Backend pronto"

# Migrar base de dados
echo ""
echo "🗄️  A configurar base de dados..."
npx prisma generate --silent
npx prisma migrate dev --name init --skip-seed 2>/dev/null || npx prisma db push 2>/dev/null
echo "✅ Base de dados configurada"

# Seed
read -p "Queres popular com dados de exemplo? (s/N): " SEED
if [[ "$SEED" == "s" || "$SEED" == "S" ]]; then
  node src/utils/seed.js
fi

# Instalar dependências frontend
echo ""
echo "📦 A instalar dependências do frontend..."
cd ../frontend
npm install --silent
echo "✅ Frontend pronto"

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  Tudo pronto! Para iniciar, abre 2 terminais:    ║"
echo "║                                                   ║"
echo "║  Terminal 1 (backend):                           ║"
echo "║    cd backend && npm run dev                     ║"
echo "║                                                   ║"
echo "║  Terminal 2 (frontend):                          ║"
echo "║    cd frontend && npm run dev                    ║"
echo "║                                                   ║"
echo "║  Acede: http://localhost:5173                    ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
