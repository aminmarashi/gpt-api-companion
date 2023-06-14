import { Message, Model } from "./types";

interface CompletionOptions {
  prompt?: string | string[] | number[] | number[][];
  suffix?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  logprobs?: number;
  echo?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  best_of?: number;
  logit_bias?: { [key: string]: number };
  user?: string;
  functions?: {
    name: string;
    description: string;
    parameters: Record<string, any>;
    function_call: 'auto'
  }[]
}

class GPTApiClient {
  constructor(private apiKey?: string, private model: Model = Model.GPT3_5_TURBO, private apiUrl: string = "https://api.openai.com") { }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  setModel(model: Model) {
    this.model = model;
  }

  getModel(): Model {
    return this.model;
  }

  async post(path: string, data: any) {
    if (!this.apiKey) {
      throw new Error("Please set your GPT API Token by clicking on the extension icon.");
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    const response = await fetch(`${this.apiUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async chat(messages: Message[], options?: CompletionOptions): Promise<{content: string} | { function_call: {name: string}, [key: string]: any }> {
    const response = await this.post("/v1/chat/completions", {
      ...(options || {}),
      messages: messages.map((message) => {
        const [role] = Object.keys(message);
        return {
          role,
          ...(role === 'function' ? { name: (message as any).functionName } : {}),
          content: message[role as keyof Message],
        }
      }),
      model: this.model,
    });

    return response.choices[0].message;
  }
}

const gptApiClient = new GPTApiClient();
export default gptApiClient;
