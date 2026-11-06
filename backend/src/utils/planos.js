// Quem pode usar o que. Para mudar o que cada plano inclui, e so mexer AQUI
// (e no espelho do site: frontend/src/utils/planos.js).
const ORDEM = { BASICO: 0, PROFISSIONAL: 1, PREMIUM: 2 };

// Plano minimo necessario para cada recurso
const RECURSOS = {
  crm:                   'PROFISSIONAL', // ficha e historico do cliente
  relatoriosFinanceiros: 'PROFISSIONAL', // relatorio mensal
  emailLembretes:        'PROFISSIONAL', // lembretes por email ao cliente
  logoPagina:            'PROFISSIONAL', // logotipo na pagina de marcacao
  whatsappAutomatico:    'PREMIUM',
  fidelidade:            'PREMIUM',      // pontos por visita
  relatoriosAvancados:   'PREMIUM',
  listaEspera:           'PREMIUM',
  corPropria:            'PREMIUM',      // cor da pagina de marcacao
  semMarca:              'PREMIUM',      // sem "Feito com Agenda Aqui"
  suportePrioritario:    'PREMIUM',
};

const NOMES = { BASICO: 'Básico', PROFISSIONAL: 'Profissional', PREMIUM: 'Premium' };

function nivel(plano) {
  return ORDEM[plano] ?? 0;
}

function temRecurso(plano, recurso) {
  const minimo = RECURSOS[recurso];
  return minimo !== undefined && nivel(plano) >= nivel(minimo);
}

function recursosDoPlano(plano) {
  const r = {};
  for (const k of Object.keys(RECURSOS)) r[k] = temRecurso(plano, k);
  return r;
}

// Middleware: bloqueia no SERVIDOR (esconder o botao no site nao chega)
function exigirRecurso(recurso) {
  return (req, res, next) => {
    const plano = req.usuario?.negocio?.plano;
    if (temRecurso(plano, recurso)) return next();
    const necessario = RECURSOS[recurso];
    return res.status(403).json({
      codigo: 'PLANO_INSUFICIENTE',
      planoNecessario: necessario,
      erro: `Este recurso está disponível a partir do plano ${NOMES[necessario]}.`,
    });
  };
}

// Pontos de fidelidade: 1 ponto por cada 1.000 Kz, minimo 1 por visita
function pontosDaVisita(preco) {
  return Math.max(1, Math.floor((preco || 0) / 1000));
}

// Precos mensais por moeda (valores inteiros). Para mudar precos, e so mexer AQUI
// (e no espelho do site: frontend/src/utils/planos.js). AOA continua a ser pago por Multicaixa/IBAN;
// USD, EUR e BRL sao pagos online pelo Paddle (cartao, PayPal e Pix em reais).
const PRECOS = {
  PROFISSIONAL: { AOA: 8000,  USD: 9,  EUR: 8,  BRL: 49 },
  PREMIUM:      { AOA: 19000, USD: 22, EUR: 20, BRL: 119 },
};
const MOEDAS_ONLINE = ['USD', 'EUR', 'BRL'];

function precoDoPlano(plano, moeda) {
  return PRECOS[plano]?.[moeda];
}

module.exports = {
  PRECOS, MOEDAS_ONLINE, precoDoPlano, RECURSOS, NOMES, nivel, temRecurso, recursosDoPlano, exigirRecurso, pontosDaVisita };
