import { NDAFormData } from './types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  message: string
  fields: Partial<NDAFormData>
  is_complete: boolean
}

export async function sendChatMessage(
  messages: ChatMessage[],
  currentFields: Partial<NDAFormData>,
): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, current_fields: currentFields }),
  })
  if (!res.ok) throw new Error(`Chat API error: ${res.status}`)
  return res.json()
}

export async function saveDocument(
  documentName: string,
  generatedDocument: string,
  fields: Partial<NDAFormData>,
): Promise<{ id: number }> {
  const fieldEntries = Object.entries(fields).flatMap(([key, val]) => {
    if (val && typeof val === 'object') {
      return Object.entries(val).map(([k, v]) => ({
        field_name: `${key}.${k}`,
        user_input: String(v),
      }))
    }
    return [{ field_name: key, user_input: String(val ?? '') }]
  })

  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_name: documentName,
      generated_document: generatedDocument,
      fields: fieldEntries,
    }),
  })
  if (!res.ok) throw new Error(`Save API error: ${res.status}`)
  return res.json()
}
