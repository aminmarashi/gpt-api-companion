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