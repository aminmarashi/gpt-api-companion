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

  async chat(messages: Message[]): Promise<string> {
    const response = await this.post("/v1/chat/completions", {
      messages: messages.map((message) => {
        const [role] = Object.keys(message);
        return {
          role,
          content: message[role as keyof Message],
        }
      }),
      model: "gpt-3.5-turbo"
    });

    return response.choices[0].message.content;
  }
}

const gptApiClient = new GPTApiClient();
export default gptApiClient;
