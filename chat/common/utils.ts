import { Model } from "./types.ts";

export const limits = {
  [Model.GPT3_5_TURBO]: 16385,
  [Model.GPT4]: 8192,
  [Model.GPT4_TURBO]: 128000,
  [Model.GPT_4O]: 128000,
  [Model.GPT_4O_MINI]: 128000,
  [Model.O1_PREVIEW]: 128000,
  [Model.O1_MINI]: 128000,
};

export function getGPTModel(modelValue: string): Model {
  for (const model in Model) {
    if (Model[model] === modelValue) {
      return Model[model];
    }
  }
  return Model.GPT_4O;
}
