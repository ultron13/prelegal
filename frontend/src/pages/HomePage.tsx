import { useState } from 'react'
import { NDAForm } from '@/components/NDAForm'
import { NDAPreview } from '@/components/NDAPreview'
import { NDAFormData } from '@/lib/types'

const defaultFormData: NDAFormData = {
  purpose: 'Evaluating whether to enter into a business relationship with the other party.',
  effectiveDate: new Date().toISOString().split('T')[0],
  mndaTerm: 'expires',
  mndaTermYears: '1',
  termOfConfidentiality: 'years',
  confidentialityYears: '1',
  governingLaw: '',
  jurisdiction: '',
  party1: { name: '', title: '', company: '', email: '' },
  party2: { name: '', title: '', company: '', email: '' },
}

interface HomePageProps {
  onLogout: () => void
}

export function HomePage({ onLogout }: HomePageProps) {
  const [view, setView] = useState<'form' | 'preview'>('form')
  const [formData, setFormData] = useState<NDAFormData>(defaultFormData)

  if (view === 'preview') {
    return (
      <NDAPreview
        data={formData}
        onBack={() => setView('form')}
      />
    )
  }

  return (
    <NDAForm
      initialData={formData}
      onSubmit={(data) => {
        setFormData(data)
        setView('preview')
      }}
      onLogout={onLogout}
    />
  )
}
