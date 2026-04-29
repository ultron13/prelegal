import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginPage } from '../pages/LoginPage'

vi.mock('../lib/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

import { login, register } from '../lib/api'
const mockLogin = login as ReturnType<typeof vi.fn>
const mockRegister = register as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

function submitForm() {
  const email = screen.getByPlaceholderText('you@company.com')
  fireEvent.submit(email.closest('form')!)
}

describe('LoginPage', () => {
  it('renders sign-in tab by default with email input', () => {
    render(<LoginPage onLogin={vi.fn()} />)
    expect(screen.getByText('PreLegal')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('switches to create-account tab and shows confirm password field', () => {
    render(<LoginPage onLogin={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    expect(passwordInputs).toHaveLength(2)
  })

  it('calls login API and onLogin on successful sign-in', async () => {
    mockLogin.mockResolvedValue({ access_token: 'tok123', email: 'user@test.com' })
    const onLogin = vi.fn()
    render(<LoginPage onLogin={onLogin} />)

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'user@test.com' } })
    const [pwdInput] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(pwdInput, { target: { value: 'password123' } })
    submitForm()

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'password123')
      expect(onLogin).toHaveBeenCalledWith('tok123', 'user@test.com')
    })
  })

  it('shows error message on failed sign-in', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'))
    render(<LoginPage onLogin={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'bad@test.com' } })
    const [pwdInput] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(pwdInput, { target: { value: 'wrongpass' } })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })

  it('calls register API on create account and invokes onLogin', async () => {
    mockRegister.mockResolvedValue({ access_token: 'newtok', email: 'new@test.com' })
    const onLogin = vi.fn()
    render(<LoginPage onLogin={onLogin} />)

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'new@test.com' } })
    const [pwdInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(pwdInput, { target: { value: 'secure123' } })
    fireEvent.change(confirmInput, { target: { value: 'secure123' } })
    submitForm()

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('new@test.com', 'secure123')
      expect(onLogin).toHaveBeenCalledWith('newtok', 'new@test.com')
    })
  })

  it('shows error when passwords do not match on sign-up', async () => {
    render(<LoginPage onLogin={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'user@test.com' } })
    const [pwdInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(pwdInput, { target: { value: 'abc123' } })
    fireEvent.change(confirmInput, { target: { value: 'different' } })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })
})
