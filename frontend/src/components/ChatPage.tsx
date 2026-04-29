import { useState, useEffect, useRef } from 'react'
import { Scale, LogOut, Send, FileText } from 'lucide-react'
import { DocumentFields } from '@/lib/types'
import { sendChatMessage, ChatMessage } from '@/lib/api'

interface ChatPageProps {
  onLogout: () => void
  onComplete: (fields: DocumentFields) => void
}

const INITIAL_GREETING =
  "Hi! I'm your **PreLegal** assistant. I can help you create any of these legal documents:\n\n" +
  "**Mutual NDA** · **Cloud Service Agreement** · **Service Level Agreement** · **Data Processing Agreement** · " +
  "**Design Partner Agreement** · **Professional Services Agreement** · **Partnership Agreement** · " +
  "**Business Associate Agreement** · **Software License Agreement** · **Pilot Agreement** · **AI Addendum**\n\n" +
  "What type of **legal document** do you need today?"

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
}

function FieldRow({ label, value }: { label: string; value?: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-3 text-xs text-slate-500 font-medium w-36 align-top">{label}</td>
      <td className="py-2 text-xs text-slate-800 align-top">
        {value ? value : <span className="text-slate-300 italic">&mdash;</span>}
      </td>
    </tr>
  )
}

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim()
}

export function ChatPage({ onLogout, onComplete }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: INITIAL_GREETING },
  ])
  const [fields, setFields] = useState<DocumentFields>({})
  const [isComplete, setIsComplete] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await sendChatMessage(updatedMessages, fields)
      const mergedFields = deepMergeFields(fields, res.fields)
      setFields(mergedFields)
      setIsComplete(res.is_complete)
      setMessages([...updatedMessages, { role: 'assistant', content: res.message }])
    } catch {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleGenerate = () => {
    onComplete(fields)
  }

  const documentType = typeof fields.documentType === 'string' ? fields.documentType : undefined

  const party1 = fields.party1 && typeof fields.party1 === 'object'
    ? fields.party1 as Record<string, string>
    : null
  const party2 = fields.party2 && typeof fields.party2 === 'object'
    ? fields.party2 as Record<string, string>
    : null

  const PARTY_KEYS = new Set(['party1', 'party2'])
  const DOC_TYPE_KEY = 'documentType'

  const previewFields = Object.entries(fields).filter(
    ([k]) => !PARTY_KEYS.has(k) && k !== DOC_TYPE_KEY && typeof fields[k] !== 'object'
  ) as [string, string][]

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <header className="bg-slate-900 text-white py-3 px-6 shadow-lg shrink-0">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Scale className="w-5 h-5 text-[#50E3C2] shrink-0" />
          <span className="font-semibold tracking-tight">PreLegal</span>
          <span className="text-slate-400 text-sm ml-2 hidden sm:block">
            {documentType ?? 'Legal Document Assistant'}
          </span>
          <button
            onClick={onLogout}
            className="ml-auto text-slate-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden max-w-7xl w-full mx-auto">
        <div className="flex flex-col flex-1 min-w-0 border-r border-slate-200">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#4A90E2] text-white rounded-br-sm'
                      : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 flex gap-3 items-end"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90E2] disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 flex items-center justify-center bg-[#4A90E2] hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="w-80 xl:w-96 shrink-0 flex flex-col bg-white overflow-y-auto">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-[#4A90E2]" />
              <h2 className="text-sm font-semibold text-slate-900">
                {documentType ?? 'Document Draft'}
              </h2>
            </div>
            <p className="text-xs text-slate-400">Updates as we chat</p>
          </div>

          <div className="flex-1 p-5">
            {previewFields.length > 0 && (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Agreement Terms
                </p>
                <table className="w-full text-sm border-collapse mb-6">
                  <tbody>
                    {previewFields.map(([key, value]) => (
                      <FieldRow key={key} label={toLabel(key)} value={value} />
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Parties
            </p>
            <div className="space-y-3 mb-6">
              {[party1, party2].map((party, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-3 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Party {i + 1}</p>
                  {party?.company
                    ? <p className="text-sm font-medium text-slate-800">{party.company}</p>
                    : <p className="text-xs text-slate-300 italic">&mdash;</p>
                  }
                  {party?.name && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {party.name}{party.title ? `, ${party.title}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isComplete && (
            <div className="shrink-0 p-5 border-t border-slate-100">
              <button
                onClick={handleGenerate}
                className="w-full bg-[#50E3C2] hover:bg-teal-400 active:bg-teal-500 text-slate-900 font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm"
              >
                Generate Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function deepMergeFields(current: DocumentFields, incoming: DocumentFields): DocumentFields {
  const result = { ...current }
  for (const key of Object.keys(incoming)) {
    const val = incoming[key]
    if (val === null || val === undefined || val === '') continue
    if (typeof val === 'object' && !Array.isArray(val)) {
      const cur = result[key]
      result[key] = { ...(cur && typeof cur === 'object' ? cur as object : {}), ...val as object }
    } else {
      result[key] = val
    }
  }
  return result
}
