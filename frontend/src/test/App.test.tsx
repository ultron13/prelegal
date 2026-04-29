import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'

vi.mock('../lib/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  sendChatMessage: vi.fn(),
  getSavedDocuments: vi.fn().mockResolvedValue([]),
}))

import { login } from '../lib/api'
const mockLogin = login as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('App', () => {
  it('starts at the login page when not authenticated', () => {
    render(<App />)
    expect(screen.getByText('PreLegal')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
  })

  it('navigates to home page after successful login', async () => {
    mockLogin.mockResolvedValue({ access_token: 'tok123', email: 'user@test.com' })

    render(<App />)

    const emailInput = screen.getByPlaceholderText('you@company.com')
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } })
    const [pwdInput] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(pwdInput, { target: { value: 'pass' } })
    fireEvent.submit(emailInput.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('Draft a legal document')).toBeInTheDocument()
    })
  })

  it('restores auth state from localStorage on load', () => {
    localStorage.setItem(
      'prelegal_auth',
      JSON.stringify({ token: 'stored-tok', email: 'stored@test.com' }),
    )

    render(<App />)
    expect(screen.getByText('Draft a legal document')).toBeInTheDocument()
    expect(screen.getByText('stored@test.com')).toBeInTheDocument()
  })
})
