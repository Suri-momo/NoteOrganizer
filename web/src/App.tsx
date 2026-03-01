import { useState } from 'react'
import { ArrowRight, BookOpen, ExternalLink, FileText, Sparkles } from 'lucide-react'

const API_URL = 'http://localhost:8000'

interface Summary {
  title: string
  summary: string
  brief: string
  key_takeaways: string[]
  source_url?: string
}

function App() {
  const [url, setUrl] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [result, setResult] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'link' | 'note'>('link')

  const summarizeLink = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setSaveSuccess(null)
    try {
      const response = await fetch(`${API_URL}/summarize/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!response.ok) throw new Error('Failed to summarize link')
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const summarizeNote = async () => {
    if (!noteContent.trim()) return
    setLoading(true)
    setError('')
    setSaveSuccess(null)
    try {
      const response = await fetch(`${API_URL}/summarize/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      })
      if (!response.ok) throw new Error('Failed to summarize note')
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const saveToNotion = async () => {
    if (!result) return
    setSaving(true)
    setError('')
    setSaveSuccess(null)
    try {
      const response = await fetch(`${API_URL}/save-to-notion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.title,
          summary: result.summary,
          brief: result.brief,
          key_takeaways: result.key_takeaways,
          source_url: result.source_url || url || 'N/A',
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save to Notion')
      }
      const data = await response.json()
      if (data.success) {
        setSaveSuccess(data.notion_url || 'Saved successfully!')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save to Notion')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen noise-texture">
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-border to-transparent opacity-50" />
      <div className="fixed top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-border to-transparent opacity-50" />

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-16 md:py-24">
        {/* Header */}
        <header className="mb-20 md:mb-28">
          <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
            <div className="w-8 h-px bg-primary animate-expand-line" />
            <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-medium">
              Knowledge Distilled
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight mb-6 animate-fade-in-up delay-100"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Note<span className="italic">Organizer</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed animate-fade-in-up delay-200">
            Transform articles and notes into crystallized insights.
            <span className="block mt-1 text-foreground/70">Capture what matters, discard the noise.</span>
          </p>
        </header>

        {/* Main content */}
        <main className="grid lg:grid-cols-[1fr,1.2fr] gap-12 lg:gap-20">
          {/* Left column - Input */}
          <div className="space-y-8 animate-fade-in-up delay-300">
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-sm w-fit">
              <button
                onClick={() => setActiveTab('link')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-sm ${
                  activeTab === 'link'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookOpen size={16} />
                Article Link
              </button>
              <button
                onClick={() => setActiveTab('note')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-sm ${
                  activeTab === 'note'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText size={16} />
                Paste Note
              </button>
            </div>

            {/* Input area */}
            <div className="space-y-4">
              {activeTab === 'link' ? (
                <>
                  <label className="block">
                    <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3 block">
                      Article URL
                    </span>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-border focus:border-primary focus:outline-none transition-colors text-lg placeholder:text-muted-foreground/50"
                    />
                  </label>
                  <button
                    onClick={summarizeLink}
                    disabled={loading || !url.trim()}
                    className="group flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground font-medium transition-all hover:gap-4 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
                  >
                    {loading ? (
                      <>
                        <Sparkles size={18} className="animate-pulse" />
                        Extracting insights...
                      </>
                    ) : (
                      <>
                        Summarize
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3 block">
                      Your Notes
                    </span>
                    <textarea
                      placeholder="Paste your notes here..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-4 bg-card border border-border focus:border-primary focus:outline-none transition-colors resize-none text-base placeholder:text-muted-foreground/50 rounded-sm"
                    />
                  </label>
                  <button
                    onClick={summarizeNote}
                    disabled={loading || !noteContent.trim()}
                    className="group flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground font-medium transition-all hover:gap-4 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
                  >
                    {loading ? (
                      <>
                        <Sparkles size={18} className="animate-pulse" />
                        Extracting insights...
                      </>
                    ) : (
                      <>
                        Summarize
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div className="p-4 bg-destructive/10 border-l-2 border-destructive animate-fade-in">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Success state */}
            {saveSuccess && (
              <div className="p-4 bg-primary/10 border-l-2 border-primary animate-fade-in">
                <p className="text-sm text-primary flex items-center gap-2">
                  Saved to Notion
                  {saveSuccess.startsWith('http') && (
                    <a
                      href={saveSuccess}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      Open <ExternalLink size={14} />
                    </a>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Right column - Result */}
          <div className="lg:border-l lg:border-border lg:pl-12">
            {result ? (
              <article className="animate-fade-in-up">
                {/* Result header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div>
                    <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 block">
                      Summary
                    </span>
                    <h2
                      className="text-2xl md:text-3xl leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {result.title || 'Untitled'}
                    </h2>
                  </div>
                  <button
                    onClick={saveToNotion}
                    disabled={saving}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 border border-border hover:border-primary hover:text-primary transition-colors text-sm font-medium rounded-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save to Notion'}
                  </button>
                </div>

                {/* Divider */}
                <div className="w-12 h-px bg-primary mb-8" />

                {/* Summary text */}
                <div className="prose prose-lg max-w-none mb-10">
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {result.summary}
                  </p>
                </div>

                {/* Key takeaways */}
                {result.key_takeaways.length > 0 && (
                  <div className="pt-8 border-t border-border">
                    <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
                      Key Takeaways
                    </h3>
                    <ul className="space-y-4">
                      {result.key_takeaways.map((takeaway, index) => (
                        <li
                          key={index}
                          className="flex gap-4 animate-slide-in-left"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <span
                            className="shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium text-primary border border-primary/30 rounded-full"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {index + 1}
                          </span>
                          <span className="text-foreground/80 leading-relaxed pt-0.5">
                            {takeaway}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Source */}
                {result.source_url && (
                  <div className="mt-10 pt-6 border-t border-border">
                    <a
                      href={result.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors elegant-underline"
                    >
                      View original source
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </article>
            ) : (
              /* Empty state */
              <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-fade-in delay-400">
                <div className="w-16 h-16 mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                  <Sparkles size={24} className="text-muted-foreground/50" />
                </div>
                <p
                  className="text-xl text-muted-foreground/70 mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Your insights will appear here
                </p>
                <p className="text-sm text-muted-foreground/50">
                  Paste a link or note to get started
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-border animate-fade-in delay-500">
          <p className="text-xs text-muted-foreground tracking-wide">
            Powered by Claude AI
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
