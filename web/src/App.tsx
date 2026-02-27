import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const API_URL = 'http://localhost:8000'

interface Summary {
  summary: string
  key_takeaways: string[]
}

function App() {
  const [url, setUrl] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [result, setResult] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const summarizeLink = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">NoteOrganizer</h1>
          <p className="text-muted-foreground">
            Summarize links from WeChat and RedNotes into key takeaways
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Summarize Link</CardTitle>
              <CardDescription>Paste a link to extract and summarize content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button onClick={summarizeLink} disabled={loading || !url.trim()} className="w-full">
                {loading ? 'Processing...' : 'Summarize Link'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summarize Note</CardTitle>
              <CardDescription>Paste note content directly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your note content here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
              />
              <Button onClick={summarizeNote} disabled={loading || !noteContent.trim()} className="w-full">
                {loading ? 'Processing...' : 'Summarize Note'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{result.summary}</p>
              {result.key_takeaways.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Key Takeaways</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.key_takeaways.map((takeaway, index) => (
                      <li key={index}>{takeaway}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App
