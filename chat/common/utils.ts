import { ValueOf } from "next/dist/shared/lib/constants";
import { Model } from "./types";

export const limits = {
  [Model.GPT3_5_TURBO]: 16385,
  [Model.GPT4]: 8192,
  [Model.GPT4_TURBO]: 128000,
  [Model.GPT_4O]: 128000,
  [Model.GPT_4O_MINI]: 128000,
  [Model.O1_PREVIEW]: 128000,
};

export function getGPTModel(modelValue: Model): Model {
  for (const [key, value] of Object.entries(Model)) {
    if (value === modelValue) {
      return Model[key as keyof typeof Model];
    }
  }
  return Model.GPT_4O;
}
