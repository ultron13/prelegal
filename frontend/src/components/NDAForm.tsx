import { useState } from 'react'
import { NDAFormData, PartyInfo } from '@/lib/types'
import { ChevronRight, ChevronLeft, Scale, LogOut } from 'lucide-react'

interface NDAFormProps {
  initialData: NDAFormData
  onSubmit: (data: NDAFormData) => void
  onLogout?: () => void
}

const inputClass = (error?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition-colors ${
    error ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'
  }`

export function NDAForm({ initialData, onSubmit, onLogout }: NDAFormProps) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<NDAFormData>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof NDAFormData>(key: K, value: NDAFormData[K]) => {
    setData(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const setParty = (party: 'party1' | 'party2', field: keyof PartyInfo, value: string) => {
    setData(prev => ({ ...prev, [party]: { ...prev[party], [field]: value } }))
    setErrors(prev => ({ ...prev, [`${party}.${field}`]: '' }))
  }

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {}
    if (!data.purpose.trim()) e.purpose = 'Purpose is required'
    if (!data.effectiveDate) e.effectiveDate = 'Effective date is required'
    if (data.mndaTerm === 'expires' && (!data.mndaTermYears || Number(data.mndaTermYears) < 1))
      e.mndaTermYears = 'Enter a valid duration'
    if (data.termOfConfidentiality === 'years' && (!data.confidentialityYears || Number(data.confidentialityYears) < 1))
      e.confidentialityYears = 'Enter a valid duration'
    if (!data.governingLaw.trim()) e.governingLaw = 'Governing law is required'
    if (!data.jurisdiction.trim()) e.jurisdiction = 'Jurisdiction is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {}
    if (!data.party1.name.trim()) e['party1.name'] = 'Required'
    if (!data.party1.company.trim()) e['party1.company'] = 'Required'
    if (!data.party2.name.trim()) e['party2.name'] = 'Required'
    if (!data.party2.company.trim()) e['party2.company'] = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-slate-900 text-white py-4 px-6 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Scale className="w-5 h-5 text-[#50E3C2] shrink-0" />
          <span className="font-semibold tracking-tight">PreLegal</span>
          <span className="text-slate-400 text-sm ml-auto hidden sm:block">
            Mutual NDA Generator
          </span>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors ml-2"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto pt-8 px-4 pb-16">
        <div className="flex items-center gap-1 mb-8">
          {[
            { n: 1, label: 'Agreement Details' },
            { n: 2, label: 'Party Information' },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              {i > 0 && <div className="w-10 h-px bg-slate-300" />}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                step === n
                  ? 'bg-[#4A90E2] text-white shadow-md'
                  : step > n
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${
                step === n ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">Agreement Details</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Purpose <span className="text-red-500">*</span>
                <span className="text-slate-400 font-normal ml-1 text-xs">
                  — how Confidential Information may be used
                </span>
              </label>
              <textarea
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90E2] resize-none h-20 transition-colors ${
                  errors.purpose ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                value={data.purpose}
                onChange={e => set('purpose', e.target.value)}
                placeholder="e.g. Evaluating whether to enter into a business relationship with the other party."
              />
              {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={`rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition-colors ${
                  errors.effectiveDate ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                value={data.effectiveDate}
                onChange={e => set('effectiveDate', e.target.value)}
              />
              {errors.effectiveDate && <p className="text-red-500 text-xs mt-1">{errors.effectiveDate}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                MNDA Term <span className="text-red-500">*</span>
                <span className="text-slate-400 font-normal ml-1 text-xs">— the length of this agreement</span>
              </label>
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="mndaTerm" className="accent-[#4A90E2] w-4 h-4 cursor-pointer"
                    checked={data.mndaTerm === 'expires'} onChange={() => set('mndaTerm', 'expires')} />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">Expires after</span>
                  <input type="number" min="1" max="99"
                    className={`w-16 rounded-lg border px-2 py-1 text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition-colors ${
                      errors.mndaTermYears ? 'border-red-400' : 'border-slate-300'
                    } ${data.mndaTerm !== 'expires' ? 'opacity-40 pointer-events-none' : ''}`}
                    value={data.mndaTermYears} disabled={data.mndaTerm !== 'expires'}
                    onChange={e => set('mndaTermYears', e.target.value)} />
                  <span className="text-sm text-slate-700">year(s) from Effective Date</span>
                </label>
                {errors.mndaTermYears && <p className="text-red-500 text-xs pl-7">{errors.mndaTermYears}</p>}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="mndaTerm" className="accent-[#4A90E2] w-4 h-4 cursor-pointer"
                    checked={data.mndaTerm === 'until_terminated'} onChange={() => set('mndaTerm', 'until_terminated')} />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">Continues until terminated</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Term of Confidentiality <span className="text-red-500">*</span>
                <span className="text-slate-400 font-normal ml-1 text-xs">— how long Confidential Information is protected</span>
              </label>
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="confidentialityTerm" className="accent-[#4A90E2] w-4 h-4 cursor-pointer"
                    checked={data.termOfConfidentiality === 'years'} onChange={() => set('termOfConfidentiality', 'years')} />
                  <input type="number" min="1" max="99"
                    className={`w-16 rounded-lg border px-2 py-1 text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition-colors ${
                      errors.confidentialityYears ? 'border-red-400' : 'border-slate-300'
                    } ${data.termOfConfidentiality !== 'years' ? 'opacity-40 pointer-events-none' : ''}`}
                    value={data.confidentialityYears} disabled={data.termOfConfidentiality !== 'years'}
                    onChange={e => set('confidentialityYears', e.target.value)} />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    year(s) from Effective Date
                    <span className="text-slate-400 text-xs ml-1">(trade secrets protected until no longer a trade secret)</span>
                  </span>
                </label>
                {errors.confidentialityYears && <p className="text-red-500 text-xs pl-7">{errors.confidentialityYears}</p>}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="confidentialityTerm" className="accent-[#4A90E2] w-4 h-4 cursor-pointer"
                    checked={data.termOfConfidentiality === 'perpetuity'} onChange={() => set('termOfConfidentiality', 'perpetuity')} />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">In perpetuity</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Governing Law <span className="text-red-500">*</span>
                </label>
                <input className={inputClass(errors.governingLaw)} value={data.governingLaw}
                  onChange={e => set('governingLaw', e.target.value)} placeholder="e.g. California" />
                {errors.governingLaw && <p className="text-red-500 text-xs mt-1">{errors.governingLaw}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Jurisdiction <span className="text-red-500">*</span>
                </label>
                <input className={inputClass(errors.jurisdiction)} value={data.jurisdiction}
                  onChange={e => set('jurisdiction', e.target.value)} placeholder="e.g. San Francisco, CA" />
                {errors.jurisdiction && <p className="text-red-500 text-xs mt-1">{errors.jurisdiction}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => { if (validateStep1()) setStep(2) }}
                className="flex items-center gap-2 bg-[#4A90E2] hover:bg-blue-600 active:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm">
                Next: Party Information <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">Party Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {(['party1', 'party2'] as const).map((party, idx) => (
                <div key={party}>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                    <h3 className="text-sm font-semibold text-slate-900">Party {idx + 1}</h3>
                  </div>
                  {([
                    { key: 'name' as const, label: 'Full Name', required: true, placeholder: 'Jane Smith', type: 'text' },
                    { key: 'title' as const, label: 'Title / Role', required: false, placeholder: 'CEO', type: 'text' },
                    { key: 'company' as const, label: 'Company', required: true, placeholder: 'Acme Corp', type: 'text' },
                    { key: 'email' as const, label: 'Email / Notice Address', required: false, placeholder: 'jane@acme.com', type: 'email' },
                  ]).map(({ key, label, required, placeholder, type }) => (
                    <div key={key} className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {label} {required && <span className="text-red-500">*</span>}
                      </label>
                      <input type={type} className={inputClass(errors[`${party}.${key}`])}
                        value={data[party][key]} onChange={e => setParty(party, key, e.target.value)}
                        placeholder={placeholder} />
                      {errors[`${party}.${key}`] && <p className="text-red-500 text-xs mt-1">{errors[`${party}.${key}`]}</p>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => { if (validateStep2()) onSubmit(data) }}
                className="flex items-center gap-2 bg-[#4A90E2] hover:bg-blue-600 active:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm">
                Preview NDA <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Based on Common Paper Mutual NDA Version 1.0 · Free to use under CC BY 4.0
        </p>
      </div>
    </div>
  )
}
