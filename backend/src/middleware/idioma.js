// Traduz as mensagens de erro (campo "erro" e "erros[].msg") para o idioma do cliente.
// O site envia o cabecalho x-idioma (pt | en | es | fr). Sem cabecalho, ou em pt, nada muda.
// Mensagens que nao estao no dicionario seguem em portugues, como antes.

const TEXTOS = {
  'Acesso negado': { en: 'Access denied', es: 'Acceso denegado', fr: 'Accès refusé' },
  'Acesso negado.': { en: 'Access denied.', es: 'Acceso denegado.', fr: 'Accès refusé.' },
  'Agendamento não encontrado': { en: 'Booking not found', es: 'Reserva no encontrada', fr: 'Réservation introuvable' },
  'Ainda não tens conta. Cria uma conta primeiro.': { en: "You don't have an account yet. Create one first.", es: 'Aún no tienes cuenta. Crea una primero.', fr: "Vous n'avez pas encore de compte. Créez-en un d'abord." },
  'Chave Pix inválida': { en: 'Invalid Pix key', es: 'Clave Pix no válida', fr: 'Clé Pix invalide' },
  'Cliente não encontrado': { en: 'Client not found', es: 'Cliente no encontrado', fr: 'Client introuvable' },
  'Confirmação do Google em falta': { en: 'Google confirmation is missing', es: 'Falta la confirmación de Google', fr: 'Confirmation Google manquante' },
  'Conta desactivada. Contacta o administrador.': { en: 'Account disabled. Please contact the administrator.', es: 'Cuenta desactivada. Contacta con el administrador.', fr: "Compte désactivé. Contactez l'administrateur." },
  'Conta suspensa': { en: 'Account suspended', es: 'Cuenta suspendida', fr: 'Compte suspendu' },
  'Cor inválida. Usa o formato #RRGGBB.': { en: 'Invalid colour. Use the #RRGGBB format.', es: 'Color no válido. Usa el formato #RRGGBB.', fr: 'Couleur invalide. Utilisez le format #RRGGBB.' },
  'Data inválida': { en: 'Invalid date', es: 'Fecha no válida', fr: 'Date invalide' },
  'Data/hora inválida': { en: 'Invalid date/time', es: 'Fecha/hora no válida', fr: 'Date/heure invalide' },
  'Depoimento não encontrado': { en: 'Testimonial not found', es: 'Testimonio no encontrado', fr: 'Témoignage introuvable' },
  'Email já registado': { en: 'Email already registered', es: 'El correo ya está registrado', fr: 'Cet e-mail est déjà enregistré' },
  'Email inválido': { en: 'Invalid email', es: 'Correo no válido', fr: 'E-mail invalide' },
  'Email ou senha incorretos': { en: 'Wrong email or password', es: 'Correo o contraseña incorrectos', fr: 'E-mail ou mot de passe incorrect' },
  'Erro ao criar conta': { en: 'Could not create the account', es: 'No se pudo crear la cuenta', fr: 'Impossible de créer le compte' },
  'Erro ao fazer login': { en: 'Could not log in', es: 'No se pudo iniciar sesión', fr: 'Impossible de se connecter' },
  'Erro ao iniciar pagamento': { en: 'Could not start the payment', es: 'No se pudo iniciar el pago', fr: 'Impossible de démarrer le paiement' },
  'Erro ao guardar o depoimento': { en: 'Could not save the testimonial', es: 'No se pudo guardar el testimonio', fr: "Impossible d'enregistrer le témoignage" },
  'Erro ao carregar depoimentos': { en: 'Could not load testimonials', es: 'No se pudieron cargar los testimonios', fr: 'Impossible de charger les témoignages' },
  'Erro interno do servidor': { en: 'Internal server error', es: 'Error interno del servidor', fr: 'Erreur interne du serveur' },
  'Escolhe de 1 a 5 estrelas': { en: 'Choose 1 to 5 stars', es: 'Elige de 1 a 5 estrellas', fr: 'Choisissez de 1 à 5 étoiles' },
  'Estado inválido': { en: 'Invalid status', es: 'Estado no válido', fr: 'Statut invalide' },
  'Este negócio não tem lista de espera.': { en: 'This business has no waiting list.', es: 'Este negocio no tiene lista de espera.', fr: "Cet établissement n'a pas de liste d'attente." },
  'Fuso horário inválido': { en: 'Invalid time zone', es: 'Zona horaria no válida', fr: 'Fuseau horaire invalide' },
  'Horário indisponível': { en: 'Time slot unavailable', es: 'Horario no disponible', fr: 'Créneau indisponible' },
  'Horário indisponível para este profissional': { en: 'Time slot unavailable for this professional', es: 'Horario no disponible para este profesional', fr: 'Créneau indisponible pour ce professionnel' },
  'Idioma não suportado': { en: 'Language not supported', es: 'Idioma no admitido', fr: 'Langue non prise en charge' },
  'Já tens pedidos em espera neste negócio.': { en: 'You already have a waiting-list request with this business.', es: 'Ya tienes una solicitud en espera en este negocio.', fr: "Vous avez déjà une demande en attente dans cet établissement." },
  'Limite de marcações atingido': { en: 'Booking limit reached', es: 'Límite de reservas alcanzado', fr: 'Limite de réservations atteinte' },
  'Login com Google ainda não está configurado.': { en: 'Google sign-in is not set up yet.', es: 'El inicio de sesión con Google aún no está configurado.', fr: "La connexion Google n'est pas encore configurée." },
  'Moeda inválida': { en: 'Invalid currency', es: 'Moneda no válida', fr: 'Devise invalide' },
  'Moeda não suportada': { en: 'Currency not supported', es: 'Moneda no admitida', fr: 'Devise non prise en charge' },
  'Muitas tentativas. Tenta em 15 minutos.': { en: 'Too many attempts. Try again in 15 minutes.', es: 'Demasiados intentos. Inténtalo de nuevo en 15 minutos.', fr: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  'Muitos pedidos. Tenta novamente daqui a pouco.': { en: 'Too many requests. Please try again shortly.', es: 'Demasiadas solicitudes. Inténtalo de nuevo en un momento.', fr: 'Trop de requêtes. Réessayez dans un instant.' },
  'Muitos pedidos. Tenta novamente em 15 minutos.': { en: 'Too many requests. Try again in 15 minutes.', es: 'Demasiadas solicitudes. Inténtalo de nuevo en 15 minutos.', fr: 'Trop de requêtes. Réessayez dans 15 minutes.' },
  'Negocio nao encontrado': { en: 'Business not found', es: 'Negocio no encontrado', fr: 'Établissement introuvable' },
  'Negócio não encontrado': { en: 'Business not found', es: 'Negocio no encontrado', fr: 'Établissement introuvable' },
  'Nome e telefone são obrigatórios': { en: 'Name and phone are required', es: 'El nombre y el teléfono son obligatorios', fr: 'Le nom et le téléphone sont obligatoires' },
  'Nome e telefone válidos são obrigatórios': { en: 'A valid name and phone are required', es: 'Se requieren un nombre y un teléfono válidos', fr: 'Un nom et un téléphone valides sont obligatoires' },
  'Nome do negócio é obrigatório': { en: 'Business name is required', es: 'El nombre del negocio es obligatorio', fr: "Le nom de l'établissement est obligatoire" },
  'Nome é obrigatório': { en: 'Name is required', es: 'El nombre es obligatorio', fr: 'Le nom est obligatoire' },
  'Não foi possível confirmar a tua conta Google. Tenta novamente.': { en: "We couldn't confirm your Google account. Please try again.", es: 'No pudimos confirmar tu cuenta de Google. Inténtalo de nuevo.', fr: "Nous n'avons pas pu confirmer votre compte Google. Réessayez." },
  'Não foi possível iniciar o pagamento. Tenta novamente em instantes.': { en: "We couldn't start the payment. Please try again in a moment.", es: 'No pudimos iniciar el pago. Inténtalo de nuevo en un momento.', fr: "Impossible de démarrer le paiement. Réessayez dans un instant." },
  'Não é possível marcar no passado': { en: "You can't book a time in the past", es: 'No se puede reservar en el pasado', fr: 'Impossible de réserver dans le passé' },
  'Número inválido. Usa o formato 923456789 ou +244923456789.': { en: 'Invalid number. Use a format like 923456789 or +244923456789.', es: 'Número no válido. Usa un formato como 923456789 o +244923456789.', fr: 'Numéro invalide. Utilisez un format comme 923456789 ou +244923456789.' },
  'O link da sessão tem de começar por https://': { en: 'The session link must start with https://', es: 'El enlace de la sesión debe empezar por https://', fr: 'Le lien de la session doit commencer par https://' },
  'O pagamento online ainda não está ativo. Contacta o suporte.': { en: 'Online payment is not active yet. Please contact support.', es: 'El pago en línea aún no está activo. Contacta con soporte.', fr: "Le paiement en ligne n'est pas encore actif. Contactez le support." },
  'Para criar conta, entra com a tua conta Google.': { en: 'To create an account, sign in with your Google account.', es: 'Para crear una cuenta, entra con tu cuenta de Google.', fr: 'Pour créer un compte, connectez-vous avec votre compte Google.' },
  'Pedido inválido': { en: 'Invalid request', es: 'Solicitud no válida', fr: 'Requête invalide' },
  'Pedido demasiado grande': { en: 'Request too large', es: 'Solicitud demasiado grande', fr: 'Requête trop volumineuse' },
  'Pedido não encontrado': { en: 'Request not found', es: 'Solicitud no encontrada', fr: 'Demande introuvable' },
  'Plano expirado': { en: 'Plan expired', es: 'Plan caducado', fr: 'Forfait expiré' },
  'Plano inválido': { en: 'Invalid plan', es: 'Plan no válido', fr: 'Forfait invalide' },
  'Plano invalido': { en: 'Invalid plan', es: 'Plan no válido', fr: 'Forfait invalide' },
  'Preço inválido': { en: 'Invalid price', es: 'Precio no válido', fr: 'Prix invalide' },
  'Profissional não encontrado': { en: 'Professional not found', es: 'Profesional no encontrado', fr: 'Professionnel introuvable' },
  'Rota não encontrada': { en: 'Route not found', es: 'Ruta no encontrada', fr: 'Route introuvable' },
  'Sem permissão para esta acção': { en: "You don't have permission for this action", es: 'No tienes permiso para esta acción', fr: "Vous n'avez pas la permission pour cette action" },
  'Senha entre 6 e 128 caracteres': { en: 'Password must be 6 to 128 characters', es: 'La contraseña debe tener entre 6 y 128 caracteres', fr: 'Le mot de passe doit contenir de 6 à 128 caractères' },
  'Serviço não encontrado': { en: 'Service not found', es: 'Servicio no encontrado', fr: 'Service introuvable' },
  'Serviço suspenso': { en: 'Service suspended', es: 'Servicio suspendido', fr: 'Service suspendu' },
  'Sessão expirada. Faz login novamente.': { en: 'Session expired. Please log in again.', es: 'Sesión caducada. Inicia sesión de nuevo.', fr: 'Session expirée. Reconnectez-vous.' },
  'Telefone já registado': { en: 'Phone number already registered', es: 'El teléfono ya está registrado', fr: 'Ce téléphone est déjà enregistré' },
  'Telefone é obrigatório': { en: 'Phone is required', es: 'El teléfono es obligatorio', fr: 'Le téléphone est obligatoire' },
  'Token inválido': { en: 'Invalid token', es: 'Token no válido', fr: 'Jeton invalide' },
  'Token não fornecido': { en: 'Token not provided', es: 'Token no proporcionado', fr: 'Jeton non fourni' },
  'Utilizador inválido ou inativo': { en: 'Invalid or inactive user', es: 'Usuario no válido o inactivo', fr: 'Utilisateur invalide ou inactif' },
};

// Frases com aspas/variaveis: comparadas pelo inicio
const PREFIXOS = [
  ['Esta conta Google já tem conta no Agenda Aqui', {
    en: 'This Google account already has an Agenda Aqui account. Use "Log in".',
    es: 'Esta cuenta de Google ya tiene cuenta en Agenda Aqui. Usa "Entrar".',
    fr: 'Ce compte Google a déjà un compte Agenda Aqui. Utilisez « Se connecter ».',
  }],
  ['Demasiadas tentativas de acesso ao admin', {
    en: 'Too many admin access attempts. Try again in 15 minutes.',
    es: 'Demasiados intentos de acceso al administrador. Inténtalo de nuevo en 15 minutos.',
    fr: "Trop de tentatives d'accès admin. Réessayez dans 15 minutes.",
  }],
];

const SUPORTADOS = ['en', 'es', 'fr'];

function traduzir(msg, idioma) {
  if (typeof msg !== 'string') return msg;
  const exato = TEXTOS[msg];
  if (exato && exato[idioma]) return exato[idioma];
  for (const [inicio, trad] of PREFIXOS) {
    if (msg.startsWith(inicio) && trad[idioma]) return trad[idioma];
  }
  return msg;
}

function idiomaDoPedido(req) {
  const h = String(req.headers['x-idioma'] || '').slice(0, 2).toLowerCase();
  return SUPORTADOS.includes(h) ? h : null;
}

// Intercepta res.json: so mexe em "erro" e "erros[].msg"
function traduzirErros(req, res, next) {
  const idioma = idiomaDoPedido(req);
  if (!idioma) return next();

  const original = res.json.bind(res);
  res.json = (corpo) => {
    try {
      if (corpo && typeof corpo === 'object' && !Buffer.isBuffer(corpo)) {
        if (typeof corpo.erro === 'string') {
          corpo = { ...corpo, erro: traduzir(corpo.erro, idioma) };
        }
        if (Array.isArray(corpo.erros)) {
          corpo = { ...corpo, erros: corpo.erros.map((e) => (e && typeof e.msg === 'string' ? { ...e, msg: traduzir(e.msg, idioma) } : e)) };
        }
      }
    } catch (e) { /* nunca partir a resposta por causa da traducao */ }
    return original(corpo);
  };
  next();
}

module.exports = { traduzirErros, traduzir };
