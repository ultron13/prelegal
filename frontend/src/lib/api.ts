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

export interface SavedDocumentSummary {
  id: number
  document_name: string
  date_generated: string
}

export interface SavedDocumentDetail extends SavedDocumentSummary {
  fields_json: string | null
  generated_document: string
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function register(
  email: string,
  password: string,
): Promise<{ access_token: string; email: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Registration failed')
  }
  return res.json()
}

export async function login(
  email: string,
  password: string,
): Promise<{ access_token: string; email: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Login failed')
  }
  return res.json()
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
  token: string,
  documentName: string,
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
    headers: authHeaders(token),
    body: JSON.stringify({
      document_name: documentName,
      generated_document: documentName,
      fields_json: JSON.stringify(fields),
      fields: fieldEntries,
    }),
  })
  if (!res.ok) throw new Error(`Save API error: ${res.status}`)
  return res.json()
}

export async function getSavedDocuments(token: string): Promise<SavedDocumentSummary[]> {
  const res = await fetch('/api/documents/saved', {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function getSavedDocument(token: string, id: number): Promise<SavedDocumentDetail> {
  const res = await fetch(`/api/documents/saved/${id}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
