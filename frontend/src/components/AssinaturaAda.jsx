import { EMPRESA, EMAIL_SUPORTE } from '../utils/marca'

// Assinatura da empresa dona do produto (logotipo com fundo transparente).
// fundo: 'claro' (paginas claras: painel, login, marcacao) | 'escuro' (rodape escuro da landing)
// tamanho: 'sm' | 'md'
export default function AssinaturaAda({ fundo = 'claro', tamanho = 'md', comEmail = false, className = '' }) {
  const largura = tamanho === 'sm' ? 'w-28' : 'w-44'
  const escuro = fundo === 'escuro'
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <span className="text-[10px] uppercase tracking-widest text-slate-400">Um produto de</span>
      <img src={escuro ? '/ada-lovelace-logo-escuro.png' : '/ada-lovelace-logo-claro.png'} alt={EMPRESA}
        loading="lazy" className={`${largura} h-auto`} />
      {comEmail && (
        <a href={`mailto:${EMAIL_SUPORTE}`}
          className={`text-xs transition-colors ${escuro ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
          {EMAIL_SUPORTE}
        </a>
      )}
    </div>
  )
}
