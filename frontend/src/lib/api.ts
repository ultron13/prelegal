import { DocumentFields } from './types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  message: string
  fields: DocumentFields
  is_complete: boolean
}

export async function sendChatMessage(
  messages: ChatMessage[],
  currentFields: DocumentFields,
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
  fields: DocumentFields,
): Promise<{ id: number }> {
  const fieldEntries = Object.entries(fields).flatMap(([key, val]) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.entries(val as Record<string, unknown>).map(([k, v]) => ({
        field_name: `${key}.${k}`,
        user_input: String(v ?? ''),
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
