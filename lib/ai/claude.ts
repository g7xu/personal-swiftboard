import Anthropic from '@anthropic-ai/sdk'
import { AIProvider } from './provider'

let client: Anthropic | null = null

export const claudeProvider: AIProvider = {
  async analyze(content: string, systemPrompt: string): Promise<string> {
    client ??= new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    return textBlock?.text ?? ''
  },
}
