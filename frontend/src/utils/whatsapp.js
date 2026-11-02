// Atalho de WhatsApp sem API: abre o WhatsApp (app ou web) com a mensagem já escrita.
// Não precisa de conta Meta Business nem de aprovação.

// Normaliza números de Angola: 923456789 -> 244923456789
export function normalizarTelefone(tel) {
  let d = String(tel || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 9) d = '244' + d
  return d
}

export function linkWhatsApp(telefone, mensagem) {
  const numero = normalizarTelefone(telefone)
  if (!numero) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
