export const RolesToPrompt = {
  user: 'You',
  assistant: 'AI',
  system: 'System'
} as const

export type Role = keyof typeof RolesToPrompt

export type Message = {
  user: string
} | {
  assistant: string
} | {
  system: string
}

export enum Model {
  GPT3_5_TURBO = 'gpt-3.5-turbo',
  GPT4 = 'gpt-4',
}