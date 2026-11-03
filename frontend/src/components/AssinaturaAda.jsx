import { EMPRESA, EMAIL_SUPORTE } from '../utils/marca'

// Assinatura da empresa dona do produto. O logotipo tem fundo preto, por isso vai num cartao preto.
// tamanho: 'sm' (barra lateral / rodape de marcacao) | 'md' (landing, login)
export default function AssinaturaAda({ tamanho = 'md', comEmail = false, className = '' }) {
  const largura = tamanho === 'sm' ? 'w-28' : 'w-40'
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <span className="text-[10px] uppercase tracking-widest text-slate-400">Um produto de</span>
      <img src="/ada-lovelace-logo.png" alt={EMPRESA} loading="lazy"
        className={`${largura} h-auto rounded-xl bg-black`} />
      {comEmail && (
        <a href={`mailto:${EMAIL_SUPORTE}`} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
          {EMAIL_SUPORTE}
        </a>
      )}
    </div>
  )
}
