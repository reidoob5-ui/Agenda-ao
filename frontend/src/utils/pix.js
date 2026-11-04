// Pix "copia e cola" (BR Code estatico do Banco Central do Brasil) para o negocio receber do cliente.
// Nao e preciso nenhum servico: o codigo e gerado aqui e o cliente paga pela app do banco dele.
function tlv(id, valor) { return id + String(valor.length).padStart(2, '0') + valor }

function crc16(texto) {
  let crc = 0xFFFF
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const semAcentos = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').trim()

export function brCodePix({ chave, valor, nome = 'NEGOCIO', cidade = 'BRASIL', txid = '***' }) {
  const conta = tlv('00', 'br.gov.bcb.pix') + tlv('01', String(chave).trim())
  let corpo = tlv('00', '01') + tlv('26', conta) + tlv('52', '0000') + tlv('53', '986')
  if (valor && valor > 0) corpo += tlv('54', Number(valor).toFixed(2))
  corpo += tlv('58', 'BR') + tlv('59', (semAcentos(nome) || 'NEGOCIO').slice(0, 25)) + tlv('60', (semAcentos(cidade) || 'BRASIL').slice(0, 15))
  corpo += tlv('62', tlv('05', (semAcentos(txid).replace(/ /g, '') || '***').slice(0, 25)))
  corpo += '6304'
  return corpo + crc16(corpo)
}
export { crc16 }
