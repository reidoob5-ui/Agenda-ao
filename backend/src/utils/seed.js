const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 A popular base de dados com dados de exemplo...\n')

  // Limpar dados existentes
  await prisma.agendamento.deleteMany()
  await prisma.servico.deleteMany()
  await prisma.profissional.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.horario.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.negocio.deleteMany()
  await prisma.feriado.deleteMany()

  // Criar negócio demo
  const negocio = await prisma.negocio.create({
    data: {
      nome: 'Salão Beleza Luanda',
      email: 'demo@agendaaqui.com',
      telefone: '+244 923 456 789',
      endereco: 'Rua da Samba, 123, Miramar',
      cidade: 'Luanda',
      slug: 'salao-beleza-luanda-demo',
      plano: 'PROFISSIONAL',
      planoStatus: 'ATIVO',
    }
  })
  console.log(`✅ Negócio criado: ${negocio.nome}`)

  // Criar utilizador dono
  const senhaHash = await bcrypt.hash('demo123', 12)
  const usuario = await prisma.usuario.create({
    data: {
      negocioId: negocio.id,
      nome: 'Carlos Administrador',
      email: 'demo@agendaaqui.com',
      senha: senhaHash,
      role: 'DONO'
    }
  })
  console.log(`✅ Utilizador criado: ${usuario.email} / senha: demo123`)

  // Horários
  await prisma.horario.createMany({
    data: [
      { negocioId: negocio.id, diaSemana: 1, horaInicio: '08:00', horaFim: '18:00' },
      { negocioId: negocio.id, diaSemana: 2, horaInicio: '08:00', horaFim: '18:00' },
      { negocioId: negocio.id, diaSemana: 3, horaInicio: '08:00', horaFim: '18:00' },
      { negocioId: negocio.id, diaSemana: 4, horaInicio: '08:00', horaFim: '18:00' },
      { negocioId: negocio.id, diaSemana: 5, horaInicio: '08:00', horaFim: '18:00' },
      { negocioId: negocio.id, diaSemana: 6, horaInicio: '09:00', horaFim: '14:00' },
    ]
  })

  // Profissionais
  const profissionais = await Promise.all([
    prisma.profissional.create({ data: { negocioId: negocio.id, nome: 'Maria Santos', bio: 'Especialista em coloração e cortes modernos', ativo: true } }),
    prisma.profissional.create({ data: { negocioId: negocio.id, nome: 'João Silva', bio: 'Barbeiro com 10 anos de experiência', ativo: true } }),
    prisma.profissional.create({ data: { negocioId: negocio.id, nome: 'Ana Pereira', bio: 'Especialista em manicure e pedicure', ativo: true } }),
  ])
  console.log(`✅ ${profissionais.length} profissionais criados`)

  // Serviços
  const servicos = await Promise.all([
    prisma.servico.create({ data: { negocioId: negocio.id, nome: 'Corte de cabelo', duracaoMin: 45, preco: 3500, ativo: true } }),
    prisma.servico.create({ data: { negocioId: negocio.id, nome: 'Escova', duracaoMin: 60, preco: 4000, ativo: true } }),
    prisma.servico.create({ data: { negocioId: negocio.id, nome: 'Coloração', duracaoMin: 90, preco: 12000, ativo: true } }),
    prisma.servico.create({ data: { negocioId: negocio.id, nome: 'Barba', duracaoMin: 30, preco: 2000, ativo: true } }),
    prisma.servico.create({ data: { negocioId: negocio.id, nome: 'Manicure', duracaoMin: 40, preco: 2500, ativo: true } }),
    prisma.servico.create({ data: { negocioId: negocio.id, nome: 'Pedicure', duracaoMin: 50, preco: 3000, ativo: true } }),
  ])
  console.log(`✅ ${servicos.length} serviços criados`)

  // Associar profissionais a serviços
  await prisma.servicoProfissional.createMany({
    data: [
      { servicoId: servicos[0].id, profissionalId: profissionais[0].id },
      { servicoId: servicos[0].id, profissionalId: profissionais[1].id },
      { servicoId: servicos[1].id, profissionalId: profissionais[0].id },
      { servicoId: servicos[2].id, profissionalId: profissionais[0].id },
      { servicoId: servicos[3].id, profissionalId: profissionais[1].id },
      { servicoId: servicos[4].id, profissionalId: profissionais[2].id },
      { servicoId: servicos[5].id, profissionalId: profissionais[2].id },
    ]
  })

  // Clientes
  const clientes = await Promise.all([
    prisma.cliente.create({ data: { negocioId: negocio.id, nome: 'Ana Ferreira', telefone: '+244923456001', pontosFidelidade: 120 } }),
    prisma.cliente.create({ data: { negocioId: negocio.id, nome: 'Carlos Neto', telefone: '+244923456002', pontosFidelidade: 45 } }),
    prisma.cliente.create({ data: { negocioId: negocio.id, nome: 'Sofia Lopes', telefone: '+244923456003', pontosFidelidade: 80 } }),
    prisma.cliente.create({ data: { negocioId: negocio.id, nome: 'Pedro Mendes', telefone: '+244923456004', pontosFidelidade: 20 } }),
    prisma.cliente.create({ data: { negocioId: negocio.id, nome: 'Luísa Teixeira', telefone: '+244923456005', pontosFidelidade: 60 } }),
  ])
  console.log(`✅ ${clientes.length} clientes criados`)

  // Agendamentos de hoje e recentes
  const hoje = new Date()
  const agendamentos = [
    { clienteId: clientes[0].id, profissionalId: profissionais[0].id, servicoId: servicos[0].id, hora: 9, status: 'CONFIRMADO' },
    { clienteId: clientes[1].id, profissionalId: profissionais[1].id, servicoId: servicos[3].id, hora: 10, status: 'CONFIRMADO' },
    { clienteId: clientes[2].id, profissionalId: profissionais[2].id, servicoId: servicos[4].id, hora: 11, status: 'PENDENTE' },
    { clienteId: clientes[3].id, profissionalId: profissionais[0].id, servicoId: servicos[1].id, hora: 14, status: 'PENDENTE' },
    { clienteId: clientes[4].id, profissionalId: profissionais[0].id, servicoId: servicos[2].id, hora: 15, status: 'CONFIRMADO' },
  ]

  for (const ag of agendamentos) {
    const dataHora = new Date(hoje)
    dataHora.setHours(ag.hora, 0, 0, 0)
    const servico = servicos.find(s => s.id === ag.servicoId)
    await prisma.agendamento.create({
      data: {
        negocioId: negocio.id,
        clienteId: ag.clienteId,
        profissionalId: ag.profissionalId,
        servicoId: ag.servicoId,
        dataHora,
        duracaoMin: servico.duracaoMin,
        preco: servico.preco,
        status: ag.status
      }
    })
  }
  console.log(`✅ ${agendamentos.length} agendamentos criados para hoje`)

  // Feriados nacionais de Angola
  const anoAtual = new Date().getFullYear()
  await prisma.feriado.createMany({
    data: [
      { data: new Date(`${anoAtual}-01-01`), nome: 'Ano Novo', nacional: true },
      { data: new Date(`${anoAtual}-02-04`), nome: 'Dia do Inicio da Luta Armada', nacional: true },
      { data: new Date(`${anoAtual}-03-08`), nome: 'Dia Internacional da Mulher', nacional: true },
      { data: new Date(`${anoAtual}-04-04`), nome: 'Dia da Paz e Reconciliação Nacional', nacional: true },
      { data: new Date(`${anoAtual}-05-01`), nome: 'Dia Internacional do Trabalhador', nacional: true },
      { data: new Date(`${anoAtual}-06-01`), nome: 'Dia da Criança', nacional: true },
      { data: new Date(`${anoAtual}-09-17`), nome: 'Dia do Herói Nacional', nacional: true },
      { data: new Date(`${anoAtual}-11-02`), nome: 'Dia dos Finados', nacional: true },
      { data: new Date(`${anoAtual}-11-11`), nome: 'Dia da Independência Nacional', nacional: true },
      { data: new Date(`${anoAtual}-12-25`), nome: 'Natal', nacional: true },
    ]
  })
  console.log('✅ Feriados nacionais de Angola adicionados')

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 Base de dados populada com sucesso!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📧 Email:  demo@agendaaqui.com`)
  console.log(`🔑 Senha:  demo123`)
  console.log(`🔗 Booking: /b/salao-beleza-luanda-demo`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
