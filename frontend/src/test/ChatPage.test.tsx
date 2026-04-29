import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatPage } from '../components/ChatPage'

vi.mock('../lib/api', () => ({
  sendChatMessage: vi.fn(),
}))

import { sendChatMessage } from '../lib/api'
const mockSendChatMessage = sendChatMessage as ReturnType<typeof vi.fn>

const INITIAL_RESPONSE = {
  message: "What type of legal document do you need today?",
  fields: {},
  is_complete: false,
}

const DOC_TYPE_RESPONSE = {
  message: "Great! I'll help you create a Mutual Non-Disclosure Agreement. What is the purpose of this agreement?",
  fields: { documentType: 'Mutual Non-Disclosure Agreement' },
  is_complete: false,
}

const PARTIAL_RESPONSE = {
  message: 'Got it! What is the effective date?',
  fields: { documentType: 'Mutual Non-Disclosure Agreement', purpose: 'evaluating a partnership' },
  is_complete: false,
}

const COMPLETE_RESPONSE = {
  message: "All done! Click 'Generate Document' to see your NDA.",
  fields: {
    documentType: 'Mutual Non-Disclosure Agreement',
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

const CSA_COMPLETE_RESPONSE = {
  message: "All done! Click 'Generate Document' to create your Cloud Service Agreement.",
  fields: {
    documentType: 'Cloud Service Agreement',
    serviceName: 'AwesomeCloud',
    subscriptionFee: '$500/month',
    billingCycle: 'monthly',
    effectiveDate: '2026-04-28',
    governingLaw: 'New York',
    jurisdiction: 'New York, NY',
    party1: { name: 'Alice', title: 'CEO', company: 'Vendor Co', email: 'alice@vendor.com' },
    party2: { name: 'Bob', title: 'CTO', company: 'Customer Inc', email: 'bob@customer.com' },
  },
  is_complete: true,
}

beforeEach(() => {
  mockSendChatMessage.mockResolvedValue(INITIAL_RESPONSE)
})

// The initial greeting renders "legal document" inside a <strong> tag - target that leaf directly.
const waitForGreeting = () => screen.getByText('legal document')

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

  it('shows document type in preview after AI identifies it', async () => {
    mockSendChatMessage.mockResolvedValueOnce(DOC_TYPE_RESPONSE)

    render(<ChatPage onLogout={vi.fn()} onComplete={vi.fn()} />)
    await waitFor(() => waitForGreeting())

    const input = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(input, { target: { value: 'I need an NDA' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      // documentType appears in both the header and the preview panel
      expect(screen.getAllByText('Mutual Non-Disclosure Agreement').length).toBeGreaterThan(0)
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
      documentType: 'Mutual Non-Disclosure Agreement',
    }))
  })

  it('calls onComplete with non-NDA document fields', async () => {
    mockSendChatMessage.mockResolvedValueOnce(CSA_COMPLETE_RESPONSE)

    const onComplete = vi.fn()
    render(<ChatPage onLogout={vi.fn()} onComplete={onComplete} />)
    await waitFor(() => waitForGreeting())

    const input = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(input, { target: { value: 'done' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => screen.getByRole('button', { name: /generate document/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate document/i }))

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      documentType: 'Cloud Service Agreement',
      serviceName: 'AwesomeCloud',
    }))
  })
})
