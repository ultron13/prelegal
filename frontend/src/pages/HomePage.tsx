import { useState } from 'react'
import { ChatPage } from '@/components/ChatPage'
import { NDAPreview } from '@/components/NDAPreview'
import { NDAFormData } from '@/lib/types'

interface HomePageProps {
  onLogout: () => void
}

export function HomePage({ onLogout }: HomePageProps) {
  const [formData, setFormData] = useState<NDAFormData | null>(null)

  if (formData) {
    return (
      <NDAPreview
        data={formData}
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
