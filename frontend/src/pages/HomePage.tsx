import { useState, useEffect } from 'react'
import { Scale, Plus, FileText, LogOut, Clock, ChevronRight } from 'lucide-react'
import { ChatPage } from '@/components/ChatPage'
import { DocumentPreview } from '@/components/DocumentPreview'
import { DocumentFields } from '@/lib/types'
import { getSavedDocuments, getSavedDocument, SavedDocumentSummary } from '@/lib/api'

interface HomePageProps {
  token: string
  userEmail: string
  onLogout: () => void
}

type View =
  | { type: 'home' }
  | { type: 'chat' }
  | { type: 'preview'; fields: DocumentFields }
  | { type: 'history-detail'; fields: DocumentFields; documentName: string }

export function HomePage({ token, userEmail, onLogout }: HomePageProps) {
  const [view, setView] = useState<View>({ type: 'home' })
  const [history, setHistory] = useState<SavedDocumentSummary[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const refreshHistory = () => {
    setHistoryLoading(true)
    getSavedDocuments(token)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => {
    refreshHistory()
  }, [])

  const openHistoryItem = async (doc: SavedDocumentSummary) => {
    try {
      const detail = await getSavedDocument(token, doc.id)
      const fields: DocumentFields = detail.fields_json
        ? JSON.parse(detail.fields_json)
        : { documentType: detail.document_name }
      setView({ type: 'history-detail', fields, documentName: detail.document_name })
    } catch {
      // silently ignore; could add a toast here
    }
  }

  if (view.type === 'chat') {
    return (
      <ChatPage
        onLogout={onLogout}
        onComplete={(fields) => setView({ type: 'preview', fields })}
      />
    )
  }

  if (view.type === 'preview') {
    return (
      <DocumentPreview
        fields={view.fields}
        token={token}
        onBack={() => setView({ type: 'chat' })}
        onSaved={refreshHistory}
      />
    )
  }

  if (view.type === 'history-detail') {
    return (
      <DocumentPreview
        fields={view.fields}
        token={token}
        readOnly
        onBack={() => setView({ type: 'home' })}
      />
    )
  }

  // Home view
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Scale className="w-5 h-5 text-[#50E3C2] shrink-0" />
          <span className="font-semibold tracking-tight">PreLegal</span>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">{userEmail}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero CTA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#333333] mb-1">Draft a legal document</h2>
            <p className="text-sm text-slate-500">
              Answer a few questions and our AI will prepare a professional draft for you.
            </p>
          </div>
          <button
            onClick={() => setView({ type: 'chat' })}
            className="flex items-center gap-2 bg-[#4A90E2] hover:bg-blue-600 active:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> New Document
          </button>
        </div>

        {/* Document history */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              Recent Documents
            </h3>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/5" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">No documents yet</p>
              <p className="text-xs text-slate-300 mt-1">
                Your generated documents will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => openHistoryItem(doc)}
                  className="w-full bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:border-[#4A90E2] hover:shadow-sm transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#4A90E2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#333333] truncate">{doc.document_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(doc.date_generated).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#4A90E2] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-slate-400 mt-10 max-w-lg mx-auto">
          Documents generated by PreLegal are drafts only and should be reviewed by a qualified attorney before use. PreLegal does not provide legal advice.
        </p>
      </div>
    </div>
  )
}
