import { AIProvider } from './provider'

const MODEL = 'gemini-2.5-flash-lite'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export const geminiProvider: AIProvider = {
  async analyze(content: string, systemPrompt: string): Promise<string> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY ?? '',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: content }] }],
        generationConfig: { maxOutputTokens: 500 },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  },
}
