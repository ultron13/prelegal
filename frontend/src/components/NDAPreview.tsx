import { NDAFormData } from '@/lib/types'
import { renderNDA, formatDate } from '@/lib/nda-renderer'
import { ChevronLeft, Scale, Download } from 'lucide-react'

interface NDAPreviewProps {
  data: NDAFormData
  onBack: () => void
}

export function NDAPreview({ data, onBack }: NDAPreviewProps) {
  const html = renderNDA(data)
  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-slate-900 text-white py-4 px-6 shadow-lg print:hidden">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Scale className="w-5 h-5 text-[#50E3C2] shrink-0" />
          <span className="font-semibold tracking-tight">PreLegal</span>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={onBack}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-medium transition-colors">
              <ChevronLeft className="w-4 h-4" /> Edit
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-[#4A90E2] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Save / Print
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 mb-6 print:rounded-none print:shadow-none print:border-none print:mb-0">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Mutual Non-Disclosure Agreement</h1>
            <p className="text-sm text-slate-500">Cover Page</p>
          </div>
          <table className="w-full text-sm border-collapse mb-8">
            <tbody>
              <CoverRow label="Effective Date" value={formatDate(data.effectiveDate)} />
              <CoverRow label="MNDA Term" value={
                data.mndaTerm === 'expires'
                  ? `${data.mndaTermYears} year(s) from the Effective Date`
                  : 'Continues until terminated'
              } />
              <CoverRow label="Term of Confidentiality" value={
                data.termOfConfidentiality === 'years'
                  ? `${data.confidentialityYears} year(s) from the Effective Date (trade secrets protected until no longer a trade secret)`
                  : 'In perpetuity'
              } />
              <CoverRow label="Purpose" value={data.purpose} />
              <CoverRow label="Governing Law" value={`State of ${data.governingLaw}`} />
              <CoverRow label="Jurisdiction" value={data.jurisdiction} />
            </tbody>
          </table>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {(['party1', 'party2'] as const).map((p, i) => {
              const party = data[p]
              return (
                <div key={p} className="border border-slate-200 rounded-xl p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Party {i + 1}</p>
                  <p className="font-semibold text-slate-900">{party.company}</p>
                  {party.name && <p className="text-slate-700 text-sm mt-1">{party.name}{party.title ? `, ${party.title}` : ''}</p>}
                  {party.email && <p className="text-slate-500 text-sm">{party.email}</p>}
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(['party1', 'party2'] as const).map((p, i) => {
              const party = data[p]
              return (
                <div key={p} className="border-t border-slate-300 pt-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    {party.company || `Party ${i + 1}`}
                  </p>
                  <div className="space-y-4">
                    <SignatureLine label="Signature" />
                    <SignatureLine label="Name" prefill={party.name} />
                    <SignatureLine label="Title" prefill={party.title} />
                    <SignatureLine label="Date" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 print:rounded-none print:shadow-none print:border-none print:pt-8">
          <div
            className="prose prose-slate prose-sm max-w-none
              [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mb-4
              [&_p]:text-slate-700 [&_p]:leading-relaxed [&_p]:mb-4
              [&_.nda-field]:text-[#FF6F61] [&_.nda-field]:font-medium [&_.nda-field]:bg-orange-50 [&_.nda-field]:px-1 [&_.nda-field]:rounded"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}

function CoverRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2.5 pr-4 text-slate-500 font-medium w-44 align-top">{label}</td>
      <td className="py-2.5 text-slate-900">{value}</td>
    </tr>
  )
}

function SignatureLine({ label, prefill }: { label: string; prefill?: string }) {
  return (
    <div>
      <div className="border-b border-slate-400 pb-1 min-h-[1.75rem] text-sm text-slate-700">{prefill || ''}</div>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}
