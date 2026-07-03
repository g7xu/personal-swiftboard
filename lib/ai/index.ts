import { AIProvider } from './provider'
import { claudeProvider } from './claude'
import { geminiProvider } from './gemini'

export function getProvider(): AIProvider {
  return process.env.AI_PROVIDER === 'claude' ? claudeProvider : geminiProvider
}
