import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByText('NoteOrganizer')).toBeInTheDocument()
  })

  it('renders both input cards', () => {
    render(<App />)
    expect(screen.getByText('Paste a link to extract and summarize content')).toBeInTheDocument()
    expect(screen.getByText('Paste note content directly')).toBeInTheDocument()
  })

  it('disables link button when input is empty', () => {
    render(<App />)
    const buttons = screen.getAllByRole('button')
    const linkButton = buttons.find(btn => btn.textContent === 'Summarize Link')
    expect(linkButton).toBeDisabled()
  })

  it('disables note button when textarea is empty', () => {
    render(<App />)
    const buttons = screen.getAllByRole('button')
    const noteButton = buttons.find(btn => btn.textContent === 'Summarize Note')
    expect(noteButton).toBeDisabled()
  })

  it('enables link button when URL is entered', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('https://...')
    fireEvent.change(input, { target: { value: 'https://example.com' } })

    const buttons = screen.getAllByRole('button')
    const linkButton = buttons.find(btn => btn.textContent === 'Summarize Link')
    expect(linkButton).not.toBeDisabled()
  })

  it('enables note button when content is entered', () => {
    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your note content here...')
    fireEvent.change(textarea, { target: { value: 'Some note content' } })

    const buttons = screen.getAllByRole('button')
    const noteButton = buttons.find(btn => btn.textContent === 'Summarize Note')
    expect(noteButton).not.toBeDisabled()
  })

  it('shows error when API call fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<App />)
    const input = screen.getByPlaceholderText('https://...')
    fireEvent.change(input, { target: { value: 'https://example.com' } })

    const buttons = screen.getAllByRole('button')
    const linkButton = buttons.find(btn => btn.textContent === 'Summarize Link')!
    fireEvent.click(linkButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('displays summary results when API call succeeds', async () => {
    const mockResponse = {
      summary: 'Test summary',
      key_takeaways: ['Takeaway 1', 'Takeaway 2'],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    render(<App />)
    const input = screen.getByPlaceholderText('https://...')
    fireEvent.change(input, { target: { value: 'https://example.com' } })

    const buttons = screen.getAllByRole('button')
    const linkButton = buttons.find(btn => btn.textContent === 'Summarize Link')!
    fireEvent.click(linkButton)

    await waitFor(() => {
      expect(screen.getByText('Test summary')).toBeInTheDocument()
      expect(screen.getByText('Takeaway 1')).toBeInTheDocument()
      expect(screen.getByText('Takeaway 2')).toBeInTheDocument()
    })
  })
})
