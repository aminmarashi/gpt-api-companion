import 'highlight.js/styles/atom-one-dark.css'
import { useEffect, useRef, useState } from 'react'
import { Chat } from '../common/Chat'
import { Message, Model } from '../common/types'
import gptApiClient from '../common/apiClient'
import Dashboard from '@/components/Dashboard'
import { createHash } from 'crypto'

function hash(str: string) {
  return createHash('sha256').update(str).digest('hex');
}

export default function Home() {
  const optionsFormRef = useRef<HTMLFormElement>(null)
  const apiTokenRef = useRef<HTMLInputElement>(null)
  const chatFormRef = useRef<HTMLFormElement>(null)
  const userInputRef = useRef<HTMLTextAreaElement>(null)
  const chatElementRef = useRef<HTMLDivElement>(null)
  const errorMessageRef = useRef<HTMLDivElement>(null)
  const modelSelectRef = useRef<HTMLSelectElement>(null)
  const spinnerRef = useRef<HTMLDivElement>(null)

  const [history, setHistory] = useState<{ id: string; messages: Message[] }[]>([])
  const [chatId, setChatId] = useState<string>(null)
  const [initialized, setInitialized] = useState<boolean>(false)
  const chatRef = useRef<Chat>(null)

  const onHistoryClick = (id: string) => {
    setChatId(id)
    const messages = history.find((h) => h.id === id)?.messages
    if (messages) {
      chatRef.current!.setMessages(messages)
    }
  }

  const updateHistory = (messages: Message[], chatId: string) => {
    fetch('/api/history', {
      method: 'POST',
      body: JSON.stringify({
        user: hash(localStorage.getItem('apiToken') || ''),
        id: chatId,
        messages,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          errorMessageRef.current!.innerText = data.error
          return
        }
        setHistory(data)
      })
  }

  const fetchHistory = () => {
    fetch(`/api/history?user=${hash(localStorage.getItem('apiToken') || '')}`, {
      method: 'GET',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          errorMessageRef.current!.innerText = data.error
          return
        }
        setHistory(data)
      })
  }

  useEffect(() => {
    if (!initialized) {
      setInitialized(true)
    } else {
      return
    }

    chatRef.current = new Chat(chatElementRef.current!)
    const chat = chatRef.current

    fetchHistory();

    apiTokenRef.current!.value = localStorage.getItem('apiToken') || '';

    userInputRef.current?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatFormRef.current?.dispatchEvent(new Event('submit'));
      }
    });

    optionsFormRef.current?.addEventListener('submit', (e) => {
      e.preventDefault();
      const apiToken = apiTokenRef.current?.value.trim();
      if (!apiToken) {
        alert('Please enter a valid GPT API Token.');
      }
      localStorage.setItem('apiToken', apiToken || '')

      alert('Options are successfully saved.');
    });

    chatFormRef.current?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = userInputRef.current?.value.trim();

      if (message) {
        await chat.appendMessage('user', message);
        userInputRef.current!.value = '';

        const apiToken = localStorage.getItem('apiToken');

        if (apiToken) {
          gptApiClient.setApiKey(apiToken);
          if (modelSelectRef.current!.value) {
            const model = modelSelectRef.current!.value === 'gpt-4' ? Model.GPT4 : Model.GPT3_5_TURBO;
            gptApiClient.setModel(model);
          }
          try {
            spinnerRef.current?.classList.remove('hidden');
            const response = await gptApiClient.chat(chat.getMessages());
            await chat.appendMessage('assistant', response);
            spinnerRef.current?.classList.add('hidden');
            errorMessageRef.current!.classList.add('hidden')
            updateHistory(chat.getMessages(), chatId);
          } catch (err) {
            console.error(err);
            errorMessageRef.current!.innerText = 'Something went wrong. Please try again.';
            errorMessageRef.current!.classList.remove('hidden')
          }
        } else {
          alert('Please set your GPT API Token in the extension settings.');
        }
      }
    });
  }, [initialized])

  return (
    <Dashboard
      history={history}
      chatId={chatId}
      onClick={onHistoryClick}
    >
      <h2 className="text-2xl text-gray-100 mb-5">GPT API Companion - Options</h2>
      <form ref={optionsFormRef} id="optionsForm" className="flex">
        <div>
          <label htmlFor="apiToken" className="block text-sm text-gray-100 mb-2">GPT API Token:</label>
          <input type="password" ref={apiTokenRef} id="apiToken" name="apiToken" className="w-full rounded p-2 border-gray-300 text-gray-800" />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 mt-4">Save</button>
        </div>
      </form>
      <hr className="my-5" />
      <h2 className="text-2xl text-gray-100 mb-5">Chat with GPT API Companion</h2>
      <div className="w-full mr-4 bg-white shadow-md rounded p-4 text-gray-800">
        <div ref={chatElementRef} id="chat" className="overflow-y-scroll h-96">
          {/* Chat will be added here dynamically */}
        </div>
      </div>
      <div className="w-full">
        <div ref={errorMessageRef} id="errorMessage"
          className="hidden mb-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {/* Error message will be added here dynamically */}
        </div>
        <div className="bg-white shadow-md rounded p-4">
          <form ref={chatFormRef} id="chatForm">
            <textarea ref={userInputRef} id="userInput" className="w-full h-32 rounded p-2 border-gray-300 text-gray-800"
              placeholder="Type your message..."></textarea>
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 mt-2">
              <span ref={spinnerRef} id="spinner" className="mr-1 hidden">
                <svg className="inline w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <style>
                    {

                      `.spinner_jCIR {
                        animation: spinner_B8Vq .9s linear infinite;
                      animation-delay: -.9s
                  }

                      .spinner_upm8 {
                        animation - delay: -.8s
                  }

                      .spinner_2eL5 {
                        animation - delay: -.7s
                  }

                      .spinner_Rp9l {
                        animation - delay: -.6s
                  }

                      .spinner_dy3W {
                        animation - delay: -.5s
                  }

                      @keyframes spinner_B8Vq {

                        0 %,
                        66.66 % {
                          animation- timing - function: cubic- bezier(0.36, .61, .3, .98);
                      y: 6px;
                      height: 12px
                    }

                      33.33% {
                        animation - timing - function: cubic- bezier(0.36, .61, .3, .98);
                      y: 1px;
                      height: 22px
                    }
                  }
                  `}
                  </style>
                  <rect className="spinner_jCIR" x="1" y="6" fill="white" width="2.8" height="12" />
                  <rect className="spinner_jCIR spinner_upm8" fill="white" x="5.8" y="6" width="2.8" height="12" />
                  <rect className="spinner_jCIR spinner_2eL5" fill="white" x="10.6" y="6" width="2.8" height="12" />
                  <rect className="spinner_jCIR spinner_Rp9l" fill="white" x="15.4" y="6" width="2.8" height="12" />
                  <rect className="spinner_jCIR spinner_dy3W" fill="white" x="20.2" y="6" width="2.8" height="12" />
                </svg>
              </span>
              Send
            </button>
            {/* a drop down to select the GPT model */}
            <select ref={modelSelectRef} id="model"
              className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow m-2">
              <option value="gpt-3.5-turbo">GPT 3.5</option>
              <option value="gpt-4">GPT 4</option>
            </select>
          </form>
        </div>
      </div>
      <script type="module" src="../dist/options.js"></script>
    </Dashboard>
  )
}
