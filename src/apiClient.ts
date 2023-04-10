class GPTApiClient {
  constructor(private apiKey?: string, private apiUrl: string = "https://api.openai.com") { }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async post(path: string, data: any) {
    if (!this.apiKey) {
      throw new Error("Please set your GPT API Token in the extension settings.");
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

  async chat(prompt: string): Promise<string> {
    const response = await this.post("/v1/engines/davinci-codex/completions", {
      prompt: prompt,
      max_tokens: 50,
      n: 1,
      stop: null,
      temperature: 0.5,
    });

    return response.data.choices[0].text.trim();
  }

  async summarize(text: string): Promise<string> {
    const prompt = `Please summarize the following text:\n\n${text}\n\nSummary:`;

    return this.chat(prompt);
  }
}

const gptApiClient = new GPTApiClient();
export default gptApiClient;
