import { renderMarkdown } from "./markdown";
import { Message, Role, RolesToPrompt } from "./types";

export class Chat {
  private element: HTMLElement;
  private messages: Message[] = [];

  constructor(element: HTMLElement) {
    this.element = element;
  }

  async appendMessage(sender: Role, message: string, hide = false) {
    this.messages.push({
      [sender]: message,
      hide,
    } as Message);
    if (sender === 'system' || hide) {
      // We don't want the system message to be shown
      return;
    }
    if (!this.element) {
      throw new Error('Chat history element not found.');
    }
    const messageElement = document.createElement('div');
    messageElement.className = 'my-2';
    messageElement.innerHTML = `<strong>${RolesToPrompt[sender]}:</strong> ${await renderMarkdown(message)}`;
    this.element.appendChild(messageElement);

    // Scroll chat history to the bottom
    this.element.scrollTop = this.element.scrollHeight;
  }

  setMessages(messages: Message[]) {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
    for (const message of messages) {
      const [sender] = Object.keys(message) as Role[];
      this.appendMessage(sender, message[sender], message.hide);
    }
  }

  getMessages(): Message[] {
    return this.messages;
  }
}