import { useState } from 'react'
import { ChatPage } from '@/components/ChatPage'
import { DocumentPreview } from '@/components/DocumentPreview'
import { DocumentFields } from '@/lib/types'

interface HomePageProps {
  onLogout: () => void
}

export function HomePage({ onLogout }: HomePageProps) {
  const [formData, setFormData] = useState<DocumentFields | null>(null)

  if (formData) {
    return (
      <DocumentPreview
        fields={formData}
        onBack={() => setFormData(null)}
      />
    )
  }

  return (
    <ChatPage
      onLogout={onLogout}
      onComplete={(data) => setFormData(data)}
    />
  )
}
