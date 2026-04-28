import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('starts at the login page', () => {
    render(<App />)
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument()
  })

  it('navigates to home page after login', () => {
    render(<App />)

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('········'), {
      target: { value: 'pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByText('Mutual NDA Assistant')).toBeInTheDocument()
  })
})
