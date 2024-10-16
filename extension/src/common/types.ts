export const RolesToPrompt = {
  user: "You",
  assistant: "AI",
  system: "System",
} as const;

export type Role = keyof typeof RolesToPrompt;

export type Message =
  | {
      user: string;
      truncate: boolean;
      encrypted: boolean;
      hide: boolean;
    }
  | {
      assistant: string;
      truncate: boolean;
      encrypted: boolean;
      hide: boolean;
    }
  | {
      system: string;
      truncate: boolean;
      encrypted: boolean;
      hide: boolean;
    };

export enum Model {
  GPT3_5_TURBO = "gpt-3.5-turbo",
  GPT4 = "gpt-4",
  GPT4_TURBO = "gpt-4-turbo",
  GPT_4O = "gpt-4o",
  GPT_4O_MINI = "gpt-4o-mini",
  O1_PREVIEW = "o1-preview",
  O1_MINI = "o1-mini",
}
