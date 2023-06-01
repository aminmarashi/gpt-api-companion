import { Chat } from "./common/Chat";
import gptApiClient from "./common/apiClient";
import { Message, Model } from "./common/types";
import { getApiToken, getsummarizerModel, safeGetSelectedText } from "./utils";
import { convert } from 'html-to-text'
import { AES, SHA256, enc } from 'crypto-js'

type History = { id: string, messages: Message[] }

function hash(str: string) {
  return SHA256(str).toString()
}

function encryptMessage(message: string, apiKey: string) {
  return AES.encrypt(message, apiKey).toString()
}

function decryptMessage(encryptedMessage: string, apiKey: string) {
  return AES.decrypt(encryptedMessage, apiKey).toString(enc.Utf8)
}

function encryptMessages(messages: Message[], key: string) {
  return messages.map((message) => {
    const [sender] = Object.keys(message)
    const encryptedMessage = encryptMessage((message as any)[sender], key)
    return {
      ...message,
      [sender]: encryptedMessage,
      encrypted: true,
    }
  })
}

function decryptHistory(historyList: History[], key: string) {
  return historyList.map((history) => {
    const decryptedMessages = decryptMessages(history.messages, key)
    return {
      ...history,
      messages: decryptedMessages
    }
  })
}

function decryptMessages(messages: Message[], key: string) {
  return messages.map((message) => {
    if (!message.encrypted) {
      return message
    }
    const [sender] = Object.keys(message)
    const decryptedMessage = decryptMessage((message as any)[sender], key)
    return {
      ...message,
      [sender]: decryptedMessage,
      encrypted: false
    }
  })
}

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  const run = async () => {
    let summary = document.getElementById('--gpt-api-companion-summary') as HTMLDivElement
    if (!summary) {
      createSummaryWindow();
    }
    const summaryWindow = document.getElementById('--gpt-api-companion-summary-window') as HTMLDivElement;
    summaryWindow.classList.remove('hidden');
    summary = document.getElementById('--gpt-api-companion-summary') as HTMLDivElement

    const spinner = document.getElementById('--gpt-api-companion-spinner') as HTMLDivElement;
    const apiToken = await getApiToken();
    const summarizerModel = await getsummarizerModel();
    const chat = new Chat(summary);
    let history: History | undefined = undefined;

    const updateHistory = async (messages: Message[]) => {
      fetch('https://chat.lit.codes/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: hash(apiToken),
          id: history ? history.id : undefined,
          messages: encryptMessages(messages, apiToken)
        }),
      })
        .then((res) => res.json())
        .then((data: History[] | { error: string }) => {
          if ('error' in data) {
            console.log(data.error)
            return
          }
          history = decryptHistory(data, apiToken).slice(-1)[0]
        })
    };
    if (apiToken) {
      gptApiClient.setModel(summarizerModel === 'gpt-4' ? Model.GPT4 : Model.GPT3_5_TURBO);
      gptApiClient.setApiKey(apiToken);
      try {
        let text = '';
        if (message.action === 'summarize-page') {
          text = convert(document.body.innerHTML);
        } else {
          text = safeGetSelectedText();
        }
        chat.appendMessage({
          sender: 'system',
          message: 'You are a summarizer bot that summarizes anything that comes next',
          hide: true
        });
        chat.appendMessage({
          sender: 'user',
          message: text,
          truncate: true,
          hide: true
        });
        spinner.classList.remove('hidden');
        const response = await gptApiClient.chat(chat.getMessages(gptApiClient.getModel()));
        chat.appendMessage({
          sender: 'assistant',
          message: response
        });
        spinner.classList.add('hidden');
        await updateHistory(chat.getMessages(gptApiClient.getModel()));
      } catch (err) {
        console.error(err);
      }
    } else {
      alert('Please set your GPT API Token in the extension settings.');
    }

    // Attach question input event listener
    const questionInput = document.getElementById('--gpt-api-companion-question') as HTMLInputElement;
    const chatForm = document.getElementById('--gpt-api-companion-form') as HTMLFormElement;
    chatForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const question = questionInput.value.trim();
      if (question) {
        chat.appendMessage({
          sender: 'user',
          message: question
        });
        questionInput.value = '';
        spinner.classList.remove('hidden');
        const response = await gptApiClient.chat(chat.getMessages(gptApiClient.getModel()));
        chat.appendMessage({
          sender: 'assistant',
          message: response
        });
        spinner.classList.add('hidden');
        await updateHistory(chat.getMessages(gptApiClient.getModel()));
      }
    });
    questionInput?.addEventListener('keypress', async (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  try {
    await run()
  } catch (e) {
    console.error(e)
  }
});

function createSummaryWindow() {
  const windowWrapper = document.createElement('div');
  windowWrapper.id = '--gpt-api-companion-summary-window';
  windowWrapper.innerHTML = `
    <div id="draggable" style="all:revert; position: fixed; top: 0; background-color: white; color: black; z-index: 10000; padding: 10px; border: 1px solid #ccc; box-sizing: border-box; max-height: 75vh; max-width: 75%; display: flex; flex-direction: column; justify-content: space-between; font-size: medium;">
      <style>
        .hidden {
          display: none;
        }
      </style>
      <div id="header" style="cursor: move; display: flex; justify-content: space-between; align-items: center;">
        <h3>Summary</h3>
        <button id="--gpt-api-companion-window-close" style="border: none; background-color: transparent; cursor: pointer; font-size: 18px;">x</button>
      </div>
      <div id="--gpt-api-companion-summary" style="margin-bottom: 1rem; height: 100%; overflow: scroll;">
        <!-- Summary will be displayed here -->
      </div>
      <form id="--gpt-api-companion-form" style="display: flex; flex-direction: column;">
        <label for="gpt-summary-question" style="display: block; margin-bottom: .5rem;">Ask further:</label>
        <div style="display: flex">
          <input type="text" id="--gpt-api-companion-question" style="width: 100%; padding: .5rem; border: 1px solid #ccc; margin-right: 4px;" />
          <button style="width: 6rem;">
            <span id="--gpt-api-companion-spinner" class="mr-1 hidden">
              <svg display="inline" style="width: 1rem;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.spinner_jCIR{animation:spinner_B8Vq .9s linear infinite;animation-delay:-.9s}.spinner_upm8{animation-delay:-.8s}.spinner_2eL5{animation-delay:-.7s}.spinner_Rp9l{animation-delay:-.6s}.spinner_dy3W{animation-delay:-.5s}@keyframes spinner_B8Vq{0%,66.66%{animation-timing-function:cubic-bezier(0.36,.61,.3,.98);y:6px;height:12px}33.33%{animation-timing-function:cubic-bezier(0.36,.61,.3,.98);y:1px;height:22px}}</style><rect class="spinner_jCIR" x="1" y="6" width="2.8" height="12"/><rect class="spinner_jCIR spinner_upm8" x="5.8" y="6" width="2.8" height="12"/><rect class="spinner_jCIR spinner_2eL5" x="10.6" y="6" width="2.8" height="12"/><rect class="spinner_jCIR spinner_Rp9l" x="15.4" y="6" width="2.8" height="12"/><rect class="spinner_jCIR spinner_dy3W" x="20.2" y="6" width="2.8" height="12"/></svg>
            </span>
          Send
          </button>
        </div>
      </form>
      <div id="resizer" style="width: 10px; height: 10px; background-color: #333; position: absolute; right: 0; bottom: 0; cursor: nwse-resize;"></div>
    </div>
  `;
  document.body.appendChild(windowWrapper);

  // Attach close button event listener
  const closeButton = document.getElementById('--gpt-api-companion-window-close');
  closeButton?.addEventListener('click', () => {
    windowWrapper.classList.add('hidden');
  });

  // Draggable functionality
  const draggable = document.getElementById('draggable') as HTMLDivElement;
  const header = document.getElementById('header') as HTMLDivElement;

  header.addEventListener('mousedown', onMouseDown);

  function onMouseDown(e: MouseEvent) {
    e.preventDefault();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    draggable.style.left = e.clientX + 'px';
    draggable.style.top = e.clientY + 'px';
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  // Resizable functionality
  const resizer = document.getElementById('resizer') as HTMLDivElement;
  resizer.addEventListener('mousedown', onResizeMouseDown);

  function onResizeMouseDown(e: MouseEvent) {
    e.preventDefault();
    document.addEventListener('mousemove', onResizeMouseMove);
    document.addEventListener('mouseup', onResizeMouseUp);
  }

  function onResizeMouseMove(e: MouseEvent) {
    const width = e.clientX - draggable.offsetLeft;
    const height = e.clientY - draggable.offsetTop;
    draggable.style.width = width + 'px';
    draggable.style.height = height + 'px';
  }

  function onResizeMouseUp() {
    document.removeEventListener('mousemove', onResizeMouseMove);
    document.removeEventListener('mouseup', onResizeMouseUp);
  }

  document.body.addEventListener('scroll', () => {
    draggable.style.top = draggable.offsetTop + window.scrollY + 'px';
  })
}
