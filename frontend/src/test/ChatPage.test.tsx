import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatPage } from '../components/ChatPage'

vi.mock('../lib/api', () => ({
  sendChatMessage: vi.fn(),
}))

import { sendChatMessage } from '../lib/api'
const mockSendChatMessage = sendChatMessage as ReturnType<typeof vi.fn>

const INITIAL_RESPONSE = {
  message: "Hi! I'll help you create a Mutual NDA. What is the purpose of this agreement?",
  fields: {},
  is_complete: false,
}

const PARTIAL_RESPONSE = {
  message: 'Got it! What is the effective date?',
  fields: { purpose: 'evaluating a partnership' },
  is_complete: false,
}

const COMPLETE_RESPONSE = {
  message: "All done! Click 'Generate Document' to see your NDA.",
  fields: {
    purpose: 'evaluating a partnership',
    effectiveDate: '2026-04-28',
    mndaTerm: 'expires' as const,
    mndaTermYears: '2',
    termOfConfidentiality: 'years' as const,
    confidentialityYears: '3',
    governingLaw: 'California',
    jurisdiction: 'San Francisco, CA',
    party1: { name: 'Alice', title: 'CEO', company: 'Acme', email: 'alice@acme.com' },
    party2: { name: 'Bob', title: 'CTO', company: 'Beta', email: 'bob@beta.com' },
  },
  is_complete: true,
}

beforeEach(() => {
  mockSendChatMessage.mockResolvedValue(INITIAL_RESPONSE)
})

// Initial greeting renders "Mutual Non-Disclosure Agreement" inside a <strong> tag,
// which is a unique leaf-level element we can query directly.
const waitForGreeting = () => screen.getByText('Mutual Non-Disclosure Agreement')

describe('ChatPage', () => {
  it('shows initial AI greeting on mount', async () => {
    render(<ChatPage onLogout={vi.fn()} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(waitForGreeting()).toBeInTheDocument()
    })
  })

  it('sends user message and shows AI reply', async () => {
    mockSendChatMessage.mockResolvedValueOnce(PARTIAL_RESPONSE)

    render(<ChatPage onLogout={vi.fn()} onComplete={vi.fn()} />)
    await waitFor(() => waitForGreeting())

    const input = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(input, { target: { value: 'evaluating a partnership' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Got it! What is the effective date/i)).toBeInTheDocument()
    })
  })

  it('updates the live preview as fields come in', async () => {
    mockSendChatMessage.mockResolvedValueOnce(PARTIAL_RESPONSE)

    render(<ChatPage onLogout={vi.fn()} onComplete={vi.fn()} />)
    await waitFor(() => waitForGreeting())

    const input = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(input, { target: { value: 'evaluating a partnership' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('evaluating a partnership')).toBeInTheDocument()
    })
  })

  it('shows Generate Document button when complete', async () => {
    mockSendChatMessage.mockResolvedValueOnce(COMPLETE_RESPONSE)

    render(<ChatPage onLogout={vi.fn()} onComplete={vi.fn()} />)
    await waitFor(() => waitForGreeting())

    const input = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(input, { target: { value: 'done' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate document/i })).toBeInTheDocument()
    })
  })

  it('calls onComplete when Generate Document is clicked', async () => {
    mockSendChatMessage.mockResolvedValueOnce(COMPLETE_RESPONSE)

    const onComplete = vi.fn()
    render(<ChatPage onLogout={vi.fn()} onComplete={onComplete} />)
    await waitFor(() => waitForGreeting())

    const input = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(input, { target: { value: 'done' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => screen.getByRole('button', { name: /generate document/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate document/i }))

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      purpose: 'evaluating a partnership',
      governingLaw: 'California',
    }))
  })
})
