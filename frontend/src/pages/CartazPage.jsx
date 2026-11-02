import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, ArrowLeft, CalendarCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Avatar } from '../components/Depoimentos'

// Cartaz A4 pronto a imprimir: logótipo, nome do negócio e QR grande para marcar
export default function CartazPage() {
  const { negocio } = useAuthStore()
  const link = `${window.location.origin}/b/${negocio?.slug}`

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Esconde a barra de ferramentas e ajusta a página ao imprimir */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="no-print max-w-[210mm] mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="btn-ghost inline-flex items-center gap-2 text-sm">
          <ArrowLeft size={15} /> Voltar
        </Link>
        <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2 text-sm">
          <Printer size={15} /> Imprimir / Guardar PDF
        </button>
      </div>

      <div
        className="mx-auto bg-white shadow-lg print:shadow-none flex flex-col items-center justify-between text-center"
        style={{ width: '210mm', minHeight: '297mm', padding: '18mm 16mm', boxSizing: 'border-box', maxWidth: '100%' }}
      >
        <div className="flex flex-col items-center gap-4">
          <Avatar nome={negocio?.nome} logo={negocio?.logo} tamanho={96} />
          <h1 className="font-display font-bold text-slate-900" style={{ fontSize: '34px', lineHeight: 1.15 }}>
            {negocio?.nome}
          </h1>
        </div>

        <div className="flex flex-col items-center gap-6">
          <p className="font-display font-bold text-brand-600" style={{ fontSize: '40px', lineHeight: 1.1 }}>
            Marca a tua hora aqui
          </p>
          <div className="p-4 border-4 border-slate-900 rounded-3xl">
            <QRCodeSVG value={link} size={300} level="M" includeMargin={false} />
          </div>
          <p className="text-slate-600" style={{ fontSize: '20px' }}>
            Aponta a câmara do telemóvel ao QR Code
          </p>
          <p className="text-slate-400 font-mono break-all" style={{ fontSize: '13px' }}>{link}</p>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <CalendarCheck size={14} /> Agendamento online · AgendaAO
        </div>
      </div>
    </div>
  )
}
