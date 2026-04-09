import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

  try {
    const { prompt, system } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    }

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: system ?? 'You are a helpful travel assistant.' }],
          },
          contents: [
            { role: 'user', parts: [{ text: prompt }] },
          ],
          generationConfig: { maxOutputTokens: 1000 },
        }),
      }
    )

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      return NextResponse.json({ error: err.error?.message ?? 'AI error' }, { status: resp.status })
    }

    const data = await resp.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({ error: 'Failed to reach AI' }, { status: 500 })
  }
}
