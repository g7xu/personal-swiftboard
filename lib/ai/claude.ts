import Anthropic from '@anthropic-ai/sdk'
import { AIProvider } from './provider'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const claudeProvider: AIProvider = {
  async analyze(content: string, systemPrompt: string): Promise<string> {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    return textBlock?.text ?? ''
  },
}

export function getProvider(): AIProvider {
  return claudeProvider
}
