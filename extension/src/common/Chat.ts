import { renderMarkdown } from "./markdown";
import { Message, Model, Role, RolesToPrompt } from "./types";
import GPT3Tokenizer from 'gpt3-tokenizer';

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' }); // or 'codex'

const limits = {
  [Model.GPT3_5_TURBO]: 4096,
  [Model.GPT4]: 8192
}

export class Chat {
  private element: HTMLElement;
  private messages: Message[] = [];

  constructor(element: HTMLElement) {
    this.element = element;
  }

  async appendMessage({
    sender,
    message,
    truncate = false,
    hide = false
  }: {
    sender: Role,
    message: string,
    truncate?: boolean,
    hide?: boolean
  }) {
    this.messages.push({
      [sender]: message,
      hide,
      truncate
    } as Message);
    if (sender === 'system' || hide) {
      // We don't want the system message to be shown
      return;
    }
    if (!this.element) {
      throw new Error('Chat history element not found.');
    }
    const messageElement = document.createElement('div');
    messageElement.className = sender === 'user' ? 'my-2 p-2 rounded-md text-gray-800' : 'my-2 bg-gray-100 p-2 rounded-md text-gray-800';
    messageElement.innerHTML = `<strong>${RolesToPrompt[sender]}:</strong> ${await renderMarkdown(message)}`;
    this.element.appendChild(messageElement);

    // Scroll chat history to the bottom
    this.element.scrollTop = this.element.scrollHeight;
  }

  setMessages(messages: Message[]) {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
    this.messages = [];
    for (const message of messages) {
      const [sender] = Object.keys(message) as Role[];
      this.appendMessage({
        sender,
        message: (message as any)[sender] as string,
        hide: message.hide,
        truncate: message.truncate
      });
    }
  }

  getMessages(model: Model): Message[] {
    const limit = limits[model];
    const wordCount = countWordsInMessages(this.messages);
    if (wordCount > limit) {
      const toTruncate = this.messages.filter(message => message.truncate);
      if (!toTruncate.length) {
        const hidden = this.messages.filter(message => message.hide);
        if (hidden.length) {
          hidden.forEach(message => message.truncate = true);
        } else {
          this.messages.forEach(message => message.truncate = true);
        }
      }
      for (const message of this.messages) {
        if (!message.truncate) continue;
        const [sender] = Object.keys(message) as Role[];
        const text = (message as any)[sender] as string;
        (message as any)[sender] = reduceWordsByPercentage(text, 0.1);
      }

      return this.getMessages(model)
    }
    return this.messages;
  }

}

function countWordsInMessages(messages: Message[]) {
  return messages.reduce((acc, message) => {
    const [sender] = Object.keys(message) as Role[];
    return acc + tokenizer.encode((message as any)[sender] as string).bpe.length;
  }, 0);
}

function reduceWordsByPercentage(str: string, percentage: number) {
  const words = str.trim().split(/\s+/);
  const numWordsToRemove = Math.floor(words.length * percentage);
  return words.slice(0, words.length - numWordsToRemove).join(' ');
}