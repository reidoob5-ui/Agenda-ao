// Termos de Uso e Politica de Privacidade (rascunho base — deve ser revisto por um advogado)
// Marcadores: {empresa} {email} {produto}
export const ATUALIZADO = '2026-11-05'

const T = {
  pt: {
    termos: {
      titulo: 'Termos de Uso',
      secoes: [
        ['1. Quem somos', '{produto} é um serviço de agendamento online operado por {empresa} ("nós"). Ao criar uma conta ou usar o serviço, aceitas estes termos.'],
        ['2. O serviço', 'Permitimos que profissionais e negócios (salões, clínicas, advogados, psicólogos, consultores, terapeutas e outros) divulguem horários, recebam marcações e façam atendimentos presenciais ou por videochamada. Alguns recursos dependem do plano contratado (Básico, Profissional ou Premium).'],
        ['3. Conta e responsabilidade', 'Tens de fornecer dados verdadeiros e manter a tua senha segura. És responsável pela atividade da tua conta e pelo conteúdo que publicas. Só podes usar o serviço de acordo com a lei do teu país.'],
        ['4. Atendimentos e profissionais', '{empresa} fornece apenas a ferramenta de agendamento. Não somos parte da relação entre o negócio e os seus clientes e não prestamos serviços médicos, jurídicos, psicológicos ou de consultoria. Cada profissional é responsável pelo seu atendimento, licenças e pelo cumprimento das regras da sua profissão. Em emergências, contacta os serviços de emergência locais.'],
        ['5. Planos e pagamentos', 'O plano Básico é gratuito. Os planos pagos são cobrados por período de 30 dias, adiantados. Pagamentos online (cartão, PayPal, Pix e outros) são processados pela Paddle, que atua como vendedora oficial (merchant of record) e emite a fatura. Em Angola também aceitamos Multicaixa Express e transferência bancária. Podes deixar de renovar a qualquer momento; o plano continua ativo até ao fim do período pago. Reembolsos seguem a política da Paddle e a lei aplicável.'],
        ['6. Pagamentos entre clientes e negócios', 'Os pagamentos que o cliente faz ao negócio (por exemplo por Pix ou transferência) são feitos diretamente ao negócio. {empresa} não os processa nem os garante.'],
        ['7. Uso proibido', 'É proibido usar o serviço para fraude, spam, conteúdo ilegal, assédio, ou para tentar aceder a dados de outras pessoas ou prejudicar a plataforma. Podemos suspender contas que violem estes termos.'],
        ['8. Disponibilidade', 'Trabalhamos para manter o serviço disponível, mas não garantimos funcionamento sem interrupções. Podemos alterar ou descontinuar funcionalidades, avisando com antecedência razoável quando for possível.'],
        ['9. Limitação de responsabilidade', 'Na máxima medida permitida por lei, {empresa} não responde por perdas indiretas, lucros cessantes ou danos resultantes do uso do serviço, e a responsabilidade total limita-se ao valor pago por ti nos 12 meses anteriores ao evento.'],
        ['10. Alterações e contacto', 'Podemos atualizar estes termos; as alterações importantes serão comunicadas. Dúvidas: {email}.'],
      ],
    },
    privacidade: {
      titulo: 'Política de Privacidade',
      secoes: [
        ['1. Quem é responsável', '{empresa} é responsável pelos dados da conta dos negócios. Cada negócio é responsável pelos dados dos seus próprios clientes que insere ou recolhe através de {produto}; nesse caso, atuamos como operador, em nome do negócio.'],
        ['2. Que dados recolhemos', 'Negócios: nome, email, telefone, endereço, fuso horário, moeda, logotipo, serviços e horários. Clientes finais: nome, telefone, email (opcional) e detalhes da marcação. Técnicos: tipo de navegador, idioma e fuso horário, para mostrar o site corretamente. Pagamentos: não guardamos dados de cartão; são tratados pela Paddle.'],
        ['3. Para que usamos', 'Para criar e gerir marcações, enviar confirmações e lembretes (email e, quando ativado, WhatsApp), gerar links de videochamada, processar pagamentos de planos, dar suporte e proteger o serviço contra abuso.'],
        ['4. Com quem partilhamos', 'Apenas com prestadores necessários: alojamento (Render, Vercel), email, WhatsApp (Meta), pagamentos (Paddle) e videochamada (Jitsi, quando usas links automáticos). Não vendemos dados pessoais.'],
        ['5. Transferências internacionais', 'Os servidores podem estar fora do teu país. Usamos prestadores que aplicam medidas de segurança adequadas.'],
        ['6. Por quanto tempo', 'Guardamos os dados enquanto a conta estiver ativa e pelo tempo necessário para obrigações legais. Podes pedir a eliminação da conta.'],
        ['7. Os teus direitos', 'Podes pedir acesso, correção, exportação ou eliminação dos teus dados, e opor-te a certos usos (por exemplo, ao abrigo da LGPD, do RGPD e de leis equivalentes). Se és cliente de um negócio, contacta primeiro o negócio. Também podes escrever para {email}.'],
        ['8. Segurança e cookies', 'Usamos ligações cifradas e controlo de acesso. Usamos armazenamento local do navegador apenas para manter a tua sessão e as tuas preferências (como o idioma), sem publicidade.'],
        ['9. Menores', 'O serviço não é dirigido a menores de 16 anos sem autorização de um responsável.'],
        ['10. Contacto', 'Privacidade: {email}.'],
      ],
    },
  },
  en: {
    termos: {
      titulo: 'Terms of Use',
      secoes: [
        ['1. Who we are', '{produto} is an online booking service operated by {empresa} ("we"). By creating an account or using the service you accept these terms.'],
        ['2. The service', 'We let professionals and businesses (salons, clinics, lawyers, psychologists, consultants, therapists and others) publish availability, receive bookings and hold in-person or video appointments. Some features depend on your plan (Basic, Professional or Premium).'],
        ['3. Account and responsibility', 'You must provide accurate information and keep your password secure. You are responsible for activity on your account and for the content you publish. You may only use the service in line with the law of your country.'],
        ['4. Appointments and professionals', '{empresa} only provides the booking tool. We are not a party to the relationship between a business and its clients and we do not provide medical, legal, psychological or consulting services. Each professional is responsible for their own services, licences and professional rules. In an emergency, contact your local emergency services.'],
        ['5. Plans and payments', 'The Basic plan is free. Paid plans are billed in advance for 30-day periods. Online payments (card, PayPal, Pix and others) are processed by Paddle, which acts as merchant of record and issues the invoice. In Angola we also accept Multicaixa Express and bank transfer. You can stop renewing at any time; the plan stays active until the end of the paid period. Refunds follow Paddle\'s policy and applicable law.'],
        ['6. Payments between clients and businesses', 'Payments a client makes to a business (for example by Pix or bank transfer) go directly to the business. {empresa} does not process or guarantee them.'],
        ['7. Prohibited use', 'You may not use the service for fraud, spam, illegal content, harassment, or to try to access other people\'s data or harm the platform. We may suspend accounts that breach these terms.'],
        ['8. Availability', 'We work to keep the service available but do not guarantee uninterrupted operation. We may change or discontinue features, giving reasonable notice when possible.'],
        ['9. Limitation of liability', 'To the maximum extent permitted by law, {empresa} is not liable for indirect losses, lost profits or damages arising from use of the service, and our total liability is limited to the amount you paid in the 12 months before the event.'],
        ['10. Changes and contact', 'We may update these terms; important changes will be communicated. Questions: {email}.'],
      ],
    },
    privacidade: {
      titulo: 'Privacy Policy',
      secoes: [
        ['1. Who is responsible', '{empresa} is responsible for business account data. Each business is responsible for the data of its own clients that it enters or collects through {produto}; in that case we act as a processor on behalf of the business.'],
        ['2. What data we collect', 'Businesses: name, email, phone, address, time zone, currency, logo, services and hours. End clients: name, phone, email (optional) and booking details. Technical: browser type, language and time zone, to display the site correctly. Payments: we do not store card data; it is handled by Paddle.'],
        ['3. What we use it for', 'To create and manage bookings, send confirmations and reminders (email and, when enabled, WhatsApp), generate video-call links, process plan payments, provide support and protect the service from abuse.'],
        ['4. Who we share it with', 'Only necessary providers: hosting (Render, Vercel), email, WhatsApp (Meta), payments (Paddle) and video calls (Jitsi, when you use automatic links). We do not sell personal data.'],
        ['5. International transfers', 'Servers may be outside your country. We use providers that apply appropriate security measures.'],
        ['6. How long we keep it', 'We keep data while the account is active and as long as needed for legal obligations. You can ask for your account to be deleted.'],
        ['7. Your rights', 'You may request access, correction, export or deletion of your data, and object to certain uses (for example under GDPR, LGPD, CCPA and similar laws). If you are a client of a business, contact the business first. You can also write to {email}.'],
        ['8. Security and cookies', 'We use encrypted connections and access controls. We use browser local storage only to keep you signed in and remember preferences (such as language), with no advertising.'],
        ['9. Minors', 'The service is not directed at people under 16 without a guardian\'s permission.'],
        ['10. Contact', 'Privacy: {email}.'],
      ],
    },
  },
  es: {
    termos: {
      titulo: 'Términos de Uso',
      secoes: [
        ['1. Quiénes somos', '{produto} es un servicio de reservas en línea operado por {empresa} ("nosotros"). Al crear una cuenta o usar el servicio aceptas estos términos.'],
        ['2. El servicio', 'Permitimos que profesionales y negocios (salones, clínicas, abogados, psicólogos, consultores, terapeutas y otros) publiquen disponibilidad, reciban reservas y atiendan de forma presencial o por videollamada. Algunas funciones dependen del plan (Básico, Profesional o Premium).'],
        ['3. Cuenta y responsabilidad', 'Debes dar datos veraces y mantener tu contraseña segura. Eres responsable de la actividad de tu cuenta y del contenido que publiques. Solo puedes usar el servicio conforme a la ley de tu país.'],
        ['4. Citas y profesionales', '{empresa} solo proporciona la herramienta de reservas. No somos parte de la relación entre el negocio y sus clientes ni prestamos servicios médicos, jurídicos, psicológicos o de consultoría. Cada profesional es responsable de su atención, licencias y normas profesionales. En una emergencia, llama a los servicios de emergencia locales.'],
        ['5. Planes y pagos', 'El plan Básico es gratuito. Los planes de pago se cobran por adelantado en periodos de 30 días. Los pagos en línea (tarjeta, PayPal, Pix y otros) los procesa Paddle, que actúa como vendedor oficial (merchant of record) y emite la factura. En Angola también aceptamos Multicaixa Express y transferencia bancaria. Puedes dejar de renovar en cualquier momento; el plan sigue activo hasta el final del periodo pagado. Los reembolsos siguen la política de Paddle y la ley aplicable.'],
        ['6. Pagos entre clientes y negocios', 'Los pagos que un cliente hace a un negocio (por ejemplo por Pix o transferencia) van directamente al negocio. {empresa} no los procesa ni los garantiza.'],
        ['7. Uso prohibido', 'Está prohibido usar el servicio para fraude, spam, contenido ilegal, acoso o para intentar acceder a datos de otras personas o dañar la plataforma. Podemos suspender cuentas que incumplan estos términos.'],
        ['8. Disponibilidad', 'Trabajamos para mantener el servicio disponible, pero no garantizamos un funcionamiento sin interrupciones. Podemos cambiar o retirar funciones, avisando con antelación razonable cuando sea posible.'],
        ['9. Limitación de responsabilidad', 'En la máxima medida permitida por la ley, {empresa} no responde por pérdidas indirectas, lucro cesante o daños derivados del uso del servicio, y la responsabilidad total se limita a lo que hayas pagado en los 12 meses anteriores al hecho.'],
        ['10. Cambios y contacto', 'Podemos actualizar estos términos; los cambios importantes se comunicarán. Dudas: {email}.'],
      ],
    },
    privacidade: {
      titulo: 'Política de Privacidad',
      secoes: [
        ['1. Quién es responsable', '{empresa} es responsable de los datos de la cuenta de los negocios. Cada negocio es responsable de los datos de sus propios clientes que introduce o recoge mediante {produto}; en ese caso actuamos como encargados por cuenta del negocio.'],
        ['2. Qué datos recogemos', 'Negocios: nombre, email, teléfono, dirección, zona horaria, moneda, logotipo, servicios y horarios. Clientes finales: nombre, teléfono, email (opcional) y datos de la reserva. Técnicos: tipo de navegador, idioma y zona horaria, para mostrar bien el sitio. Pagos: no guardamos datos de tarjeta; los gestiona Paddle.'],
        ['3. Para qué los usamos', 'Para crear y gestionar reservas, enviar confirmaciones y recordatorios (email y, si está activado, WhatsApp), generar enlaces de videollamada, procesar pagos de planes, dar soporte y proteger el servicio.'],
        ['4. Con quién los compartimos', 'Solo con proveedores necesarios: alojamiento (Render, Vercel), email, WhatsApp (Meta), pagos (Paddle) y videollamadas (Jitsi, si usas enlaces automáticos). No vendemos datos personales.'],
        ['5. Transferencias internacionales', 'Los servidores pueden estar fuera de tu país. Usamos proveedores que aplican medidas de seguridad adecuadas.'],
        ['6. Cuánto tiempo', 'Conservamos los datos mientras la cuenta esté activa y el tiempo necesario por obligaciones legales. Puedes pedir la eliminación de tu cuenta.'],
        ['7. Tus derechos', 'Puedes solicitar acceso, rectificación, exportación o eliminación de tus datos y oponerte a ciertos usos (por ejemplo bajo el RGPD, la LGPD, la CCPA y leyes similares). Si eres cliente de un negocio, contacta primero con el negocio. También puedes escribir a {email}.'],
        ['8. Seguridad y cookies', 'Usamos conexiones cifradas y control de acceso. Usamos el almacenamiento local del navegador solo para mantener tu sesión y preferencias (como el idioma), sin publicidad.'],
        ['9. Menores', 'El servicio no está dirigido a menores de 16 años sin permiso de un tutor.'],
        ['10. Contacto', 'Privacidad: {email}.'],
      ],
    },
  },
  fr: {
    termos: {
      titulo: "Conditions d'utilisation",
      secoes: [
        ['1. Qui sommes-nous', "{produto} est un service de réservation en ligne exploité par {empresa} (« nous »). En créant un compte ou en utilisant le service, tu acceptes ces conditions."],
        ['2. Le service', "Nous permettons aux professionnels et entreprises (salons, cliniques, avocats, psychologues, consultants, thérapeutes, etc.) de publier leurs disponibilités, recevoir des réservations et recevoir en présentiel ou en visioconférence. Certaines fonctions dépendent du forfait (Basique, Professionnel ou Premium)."],
        ['3. Compte et responsabilité', "Tu dois fournir des informations exactes et protéger ton mot de passe. Tu es responsable de l'activité de ton compte et des contenus que tu publies. Tu dois utiliser le service conformément à la loi de ton pays."],
        ['4. Rendez-vous et professionnels', "{empresa} fournit uniquement l'outil de réservation. Nous ne sommes pas partie à la relation entre l'entreprise et ses clients et ne fournissons pas de services médicaux, juridiques, psychologiques ou de conseil. Chaque professionnel est responsable de ses prestations, licences et règles professionnelles. En cas d'urgence, contacte les services d'urgence locaux."],
        ['5. Forfaits et paiements', "Le forfait Basique est gratuit. Les forfaits payants sont facturés d'avance par périodes de 30 jours. Les paiements en ligne (carte, PayPal, Pix, etc.) sont traités par Paddle, qui agit comme vendeur officiel (merchant of record) et émet la facture. En Angola, nous acceptons aussi Multicaixa Express et le virement bancaire. Tu peux cesser de renouveler à tout moment ; le forfait reste actif jusqu'à la fin de la période payée. Les remboursements suivent la politique de Paddle et la loi applicable."],
        ['6. Paiements entre clients et entreprises', "Les paiements d'un client à une entreprise (par exemple par Pix ou virement) sont faits directement à l'entreprise. {empresa} ne les traite ni ne les garantit."],
        ['7. Usages interdits', "Il est interdit d'utiliser le service pour la fraude, le spam, des contenus illégaux, le harcèlement, ou pour tenter d'accéder aux données d'autrui ou de nuire à la plateforme. Nous pouvons suspendre les comptes qui enfreignent ces conditions."],
        ['8. Disponibilité', "Nous nous efforçons de maintenir le service disponible mais ne garantissons pas un fonctionnement ininterrompu. Nous pouvons modifier ou retirer des fonctions, avec un préavis raisonnable lorsque c'est possible."],
        ['9. Limitation de responsabilité', "Dans les limites permises par la loi, {empresa} n'est pas responsable des pertes indirectes, manques à gagner ou dommages résultant de l'utilisation du service, et notre responsabilité totale est limitée aux sommes que tu as payées au cours des 12 mois précédant l'événement."],
        ['10. Modifications et contact', "Nous pouvons mettre à jour ces conditions ; les changements importants seront communiqués. Questions : {email}."],
      ],
    },
    privacidade: {
      titulo: 'Politique de confidentialité',
      secoes: [
        ['1. Qui est responsable', "{empresa} est responsable des données de compte des entreprises. Chaque entreprise est responsable des données de ses propres clients qu'elle saisit ou collecte via {produto} ; nous agissons alors comme sous-traitant pour son compte."],
        ['2. Données collectées', "Entreprises : nom, email, téléphone, adresse, fuseau horaire, devise, logo, services et horaires. Clients finaux : nom, téléphone, email (facultatif) et détails de la réservation. Techniques : type de navigateur, langue et fuseau horaire, pour afficher correctement le site. Paiements : nous ne stockons pas les données de carte ; elles sont traitées par Paddle."],
        ['3. Finalités', "Créer et gérer les réservations, envoyer confirmations et rappels (email et, si activé, WhatsApp), générer des liens de visioconférence, traiter les paiements des forfaits, assurer le support et protéger le service contre les abus."],
        ['4. Destinataires', "Uniquement les prestataires nécessaires : hébergement (Render, Vercel), email, WhatsApp (Meta), paiements (Paddle) et visioconférence (Jitsi, avec les liens automatiques). Nous ne vendons pas les données personnelles."],
        ['5. Transferts internationaux', "Les serveurs peuvent se trouver hors de ton pays. Nous utilisons des prestataires appliquant des mesures de sécurité adaptées."],
        ['6. Durée de conservation', "Nous conservons les données tant que le compte est actif et le temps nécessaire aux obligations légales. Tu peux demander la suppression de ton compte."],
        ['7. Tes droits', "Tu peux demander l'accès, la rectification, l'export ou la suppression de tes données et t'opposer à certains usages (par exemple au titre du RGPD, de la LGPD, du CCPA et lois similaires). Si tu es client d'une entreprise, contacte d'abord l'entreprise. Tu peux aussi écrire à {email}."],
        ['8. Sécurité et cookies', "Nous utilisons des connexions chiffrées et des contrôles d'accès. Nous utilisons le stockage local du navigateur uniquement pour maintenir ta session et tes préférences (comme la langue), sans publicité."],
        ['9. Mineurs', "Le service ne s'adresse pas aux moins de 16 ans sans l'accord d'un tuteur."],
        ['10. Contact', 'Confidentialité : {email}.'],
      ],
    },
  },
}

export const legal = (idioma, tipo) => T[idioma]?.[tipo] || T.en[tipo]
