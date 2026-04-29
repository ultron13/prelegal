import { useEffect, useRef, useState } from 'react'
import { DocumentFields, NDAFormData, PartyInfo } from '@/lib/types'
import { renderNDA, formatDate } from '@/lib/nda-renderer'
import { saveDocument } from '@/lib/api'
import { ChevronLeft, Scale, Download, CheckCircle, AlertTriangle } from 'lucide-react'

interface DocumentPreviewProps {
  fields: DocumentFields
  token: string
  onBack: () => void
  readOnly?: boolean
  onSaved?: () => void
}

function isNDAFields(f: DocumentFields): f is NDAFormData & DocumentFields {
  return (
    typeof f.purpose === 'string' &&
    typeof f.effectiveDate === 'string' &&
    (f.mndaTerm === 'expires' || f.mndaTerm === 'until_terminated')
  )
}

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim()
}

export function DocumentPreview({ fields, token, onBack, readOnly = false, onSaved }: DocumentPreviewProps) {
  const documentType = typeof fields.documentType === 'string'
    ? fields.documentType
    : 'Legal Document'

  const party1 = fields.party1 && typeof fields.party1 === 'object'
    ? fields.party1 as PartyInfo
    : null
  const party2 = fields.party2 && typeof fields.party2 === 'object'
    ? fields.party2 as PartyInfo
    : null

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const savedRef = useRef(false)

  useEffect(() => {
    if (readOnly || savedRef.current || !token) return
    savedRef.current = true
    setSaveState('saving')
    saveDocument(token, documentType, fields)
      .then(() => {
        setSaveState('saved')
        onSaved?.()
      })
      .catch(() => setSaveState('error'))
  }, [])

  const SKIP_KEYS = new Set(['party1', 'party2', 'documentType'])
  const coverFields = Object.entries(fields).filter(
    ([k, v]) => !SKIP_KEYS.has(k) && typeof v !== 'object'
  ) as [string, string][]

  const ndaHtml = isNDAFields(fields) ? renderNDA(fields as unknown as NDAFormData) : null

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-slate-900 text-white py-4 px-6 shadow-lg print:hidden">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Scale className="w-5 h-5 text-[#50E3C2] shrink-0" />
          <span className="font-semibold tracking-tight">PreLegal</span>
          <div className="ml-auto flex items-center gap-3">
            {!readOnly && saveState === 'saving' && (
              <span className="text-xs text-slate-400">Saving…</span>
            )}
            {!readOnly && saveState === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-[#50E3C2]">
                <CheckCircle className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            {!readOnly && saveState === 'error' && (
              <span className="flex items-center gap-1 text-xs text-[#FF6F61]">
                <AlertTriangle className="w-3.5 h-3.5" /> Save failed
              </span>
            )}
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {readOnly ? 'Back' : 'Edit'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#4A90E2] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Save / Print
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
        {/* Legal disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 flex items-start gap-3 print:hidden">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Draft document — for review only.</span>{' '}
            This document is AI-generated and should be considered a starting point only. Please have it reviewed by a qualified attorney before signing or relying on it.
          </p>
        </div>

        {/* Cover page */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 mb-6 print:rounded-none print:shadow-none print:border-none print:mb-0">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{documentType}</h1>
            <p className="text-sm text-slate-500">Cover Page</p>
          </div>

          {coverFields.length > 0 && (
            <table className="w-full text-sm border-collapse mb-8">
              <tbody>
                {coverFields.map(([key, value]) => (
                  <CoverRow
                    key={key}
                    label={toLabel(key)}
                    value={
                      key === 'effectiveDate'
                        ? formatDate(value)
                        : key === 'governingLaw'
                        ? `State of ${value}`
                        : value
                    }
                  />
                ))}
              </tbody>
            </table>
          )}

          {(party1 || party2) && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                {[party1, party2].map((party, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Party {i + 1}
                    </p>
                    {party ? (
                      <>
                        <p className="font-semibold text-slate-900">{party.company}</p>
                        {party.name && (
                          <p className="text-slate-700 text-sm mt-1">
                            {party.name}{party.title ? `, ${party.title}` : ''}
                          </p>
                        )}
                        {party.email && <p className="text-slate-500 text-sm">{party.email}</p>}
                      </>
                    ) : (
                      <p className="text-slate-400 text-sm italic">—</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[party1, party2].map((party, i) => (
                  <div key={i} className="border-t border-slate-300 pt-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      {party?.company ?? `Party ${i + 1}`}
                    </p>
                    <div className="space-y-4">
                      <SignatureLine label="Signature" />
                      <SignatureLine label="Name" prefill={party?.name} />
                      <SignatureLine label="Title" prefill={party?.title} />
                      <SignatureLine label="Date" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Standard terms body */}
        {ndaHtml ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 print:rounded-none print:shadow-none print:border-none print:pt-8">
            <div
              className="prose prose-slate prose-sm max-w-none
                [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mb-4
                [&_p]:text-slate-700 [&_p]:leading-relaxed [&_p]:mb-4
                [&_.nda-field]:text-[#FF6F61] [&_.nda-field]:font-medium [&_.nda-field]:bg-orange-50 [&_.nda-field]:px-1 [&_.nda-field]:rounded"
              dangerouslySetInnerHTML={{ __html: ndaHtml }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 print:rounded-none print:shadow-none print:border-none">
            <p className="text-sm text-slate-500 text-center italic">
              Standard {documentType} terms are incorporated by reference to the CommonPaper template.
            </p>
          </div>
        )}

        {/* Print-only disclaimer */}
        <div className="hidden print:block mt-8 pt-6 border-t border-slate-300">
          <p className="text-xs text-slate-500 text-center">
            DRAFT — This document is AI-generated and has not been reviewed by an attorney. It should not be relied upon without independent legal review.
          </p>
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
      <div className="border-b border-slate-400 pb-1 min-h-[1.75rem] text-sm text-slate-700">
        {prefill ?? ''}
      </div>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}
