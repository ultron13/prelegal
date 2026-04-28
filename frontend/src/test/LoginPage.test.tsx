import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginPage } from '../pages/LoginPage'

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(<LoginPage onLogin={vi.fn()} />)
    expect(screen.getByText('PreLegal')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls onLogin when form is submitted with credentials', () => {
    const onLogin = vi.fn()
    render(<LoginPage onLogin={onLogin} />)

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByRole('textbox', { hidden: true, name: /password/i }), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(onLogin).toHaveBeenCalledOnce()
  })

  it('does not call onLogin when fields are empty', () => {
    const onLogin = vi.fn()
    render(<LoginPage onLogin={onLogin} />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(onLogin).not.toHaveBeenCalled()
  })
})
