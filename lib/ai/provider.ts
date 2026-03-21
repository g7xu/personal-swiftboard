export interface AIProvider {
  analyze(content: string, systemPrompt: string): Promise<string>
}
