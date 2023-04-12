import { Chat } from "./Chat";
import gptApiClient from "./apiClient";
import { getApiToken, safeGetSelectedText } from "./utils";

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  let summary = document.getElementById('--gpt-api-companion-summary') as HTMLDivElement
  if (!summary) {
    createSummaryWindow();
  }
  const summaryWindow = document.getElementById('--gpt-api-companion-summary-window') as HTMLDivElement;
  summaryWindow.classList.remove('hidden');
  summary = document.getElementById('--gpt-api-companion-summary') as HTMLDivElement
  const apiToken = await getApiToken();
  const chat = new Chat(summary);

  if (apiToken) {
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
      const response = await gptApiClient.chat(chat.getMessages());
      chat.appendMessage('assistant', response);
    } catch (err) {
      console.error(err);
    }
  } else {
    alert('Please set your GPT API Token in the extension settings.');
  }

  // Attach question input event listener
  const questionInput = document.getElementById('--gpt-api-companion-question') as HTMLInputElement;
  questionInput?.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      // Add GPT API call to process the question and display the response
      const question = questionInput.value.trim();
      if (question) {
        chat.appendMessage('user', question);
        questionInput.value = '';
        const response = await gptApiClient.chat(chat.getMessages());
        chat.appendMessage('assistant', response);
      }
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
      <label for="gpt-summary-question" style="display: block; margin-bottom: .5rem;">Ask a question:</label>
      <input type="text" id="--gpt-api-companion-question" style="width: 100%; padding: .5rem; border: 1px solid #ccc;" />
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
