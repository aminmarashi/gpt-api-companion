export const RolesToPrompt = {
  user: 'You',
  assistant: 'AI',
  system: 'System',
  function: 'Function'
} as const

export type Role = keyof typeof RolesToPrompt

export type Message = {
  user: string
  truncate: boolean
  encrypted: boolean
  hide: boolean
} | {
  assistant: string
  truncate: boolean
  encrypted: boolean
  hide: boolean
} | {
  system: string
  truncate: boolean
  encrypted: boolean
  hide: boolean
} | {
  function: string
  truncate: false
  encrypted: boolean
  hide: true
  name: string
}

export enum Model {
  GPT3_5_TURBO = 'gpt-3.5-turbo-16k',
  GPT4 = 'gpt-4-0613',
}