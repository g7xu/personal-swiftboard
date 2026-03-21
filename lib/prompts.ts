const SYSTEM_BASE = `You organize sticky note content concisely, identify gaps in a framework, and end with a thought-provoking question. Keep the user's original idea intact. Mark missing fields with "?". End with "Reflect:" followed by one question. Be concise — this is a sticky note, not an essay. Do NOT use any markdown formatting — no bold (**), no italics (*), no headers (#), no bullet points. Output plain text only. Put each field on its own line.`

const CATEGORY_PROMPTS: Record<string, string> = {
  Thorn: `${SYSTEM_BASE}

Format the response exactly as:
[concise version of the note]
Expectation: [infer from context or ?]
Reality: [infer from context or ?]
Why: [infer from context or ?]
Action: [infer from context or ?]
Reflect: [one question about root cause or next step]`,

  Rose: `${SYSTEM_BASE}

Format the response exactly as:
[concise version of the note]
What worked: [infer from context or ?]
Why: [infer from context or ?]
How to repeat: [infer from context or ?]
Reflect: [one question about replicating the success]`,

  Seed: `${SYSTEM_BASE}

Format the response exactly as:
[concise version of the note]
Wish: [infer from context or ?]
Outcome: [infer from context or ?]
Obstacle: [infer from context or ?]
Plan: [infer from context or ?]
Reflect: [one question about feasibility or first step]`,

  Action: `${SYSTEM_BASE}

Format the response exactly as:
[concise version of the note]
Who: [infer or ?]
What: [infer or ?]
When: [infer or ?]
Where: [infer or ?]
Why: [infer or ?]
How: [infer or ?]
Reflect: [one question about completeness or priority]`,
}

export function getAnalysisPrompt(category: string): string {
  return CATEGORY_PROMPTS[category] ?? ''
}
