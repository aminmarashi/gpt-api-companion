import { Chat } from "./Chat";
import gptApiClient from "./apiClient";
import { Model } from "./types";
import { getApiToken, getSummerizerModel, safeGetSelectedText } from "./utils";

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  let summary = document.getElementById('--gpt-api-companion-summary') as HTMLDivElement
  if (!summary) {
    createSummaryWindow();
  }
  const summaryWindow = document.getElementById('--gpt-api-companion-summary-window') as HTMLDivElement;
  summaryWindow.classList.remove('hidden');
  summary = document.getElementById('--gpt-api-companion-summary') as HTMLDivElement

  const spinner = document.getElementById('--gpt-api-companion-spinner') as HTMLDivElement;
  const apiToken = await getApiToken();
  const summerizerModel = await getSummerizerModel();
  const chat = new Chat(summary);

  if (apiToken) {
    gptApiClient.setModel(summerizerModel === 'gpt-4' ? Model.GPT4 : Model.GPT3_5_TURBO);
    gptApiClient.setApiKey(apiToken);
    try {
      let text = '';
      if (message.action === 'summerize-page') {
        text = document.body.innerText;
      } else {
        text = safeGetSelectedText();
      }
      chat.appendMessage('system', 'You are a summarizer bot that summerizes anything that comes next');
      chat.appendMessage('user', text, true);
      spinner.classList.remove('hidden');
      const response = await gptApiClient.chat(chat.getMessages());
      chat.appendMessage('assistant', response);
      spinner.classList.add('hidden');
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
      chat.appendMessage('user', question);
      questionInput.value = '';
      spinner.classList.remove('hidden');
      const response = await gptApiClient.chat(chat.getMessages());
      chat.appendMessage('assistant', response);
      spinner.classList.add('hidden');
    }
  });
  questionInput?.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });
});

function createSummaryWindow() {
  const windowWrapper = document.createElement('div');
  windowWrapper.id = '--gpt-api-companion-summary-window';
  windowWrapper.innerHTML = `
    <div id="draggable" style="position: fixed; top: 0; background-color: white; color: black; z-index: 10000; padding: 10px; border: 1px solid #ccc; box-sizing: border-box;">
      <div id="header" style="cursor: move; display: flex; justify-content: space-between; align-items: center;">
        <h3>Summary</h3>
        <button id="--gpt-api-companion-window-close" style="border: none; background-color: transparent; cursor: pointer; font-size: 18px;">x</button>
      </div>
      <div id="--gpt-api-companion-summary" style="margin-bottom: 1rem;">
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
