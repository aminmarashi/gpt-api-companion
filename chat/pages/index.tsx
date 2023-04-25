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
  const [chatId, setChatId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState<boolean>(false)
  const updateHistoryRef = useRef<((messages: Message[]) => void) | null>(null)
  const chatRef = useRef<Chat | null>(null)

  const onHistoryClick = (id: string) => {
    setChatId(id)
    const messages = history.find((h) => h.id === id)?.messages
    if (messages) {
      chatRef.current!.setMessages(messages)
    }
  }

  const onHistoryDelete = (id: string) => {
    fetch(`/api/history?user=${hash(localStorage.getItem('apiToken') || '')}&id=${id}`, {
      method: 'DELETE',
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

  updateHistoryRef.current = (messages: Message[]) => {
    fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
        setChatId(data.slice(-1)[0].id)
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

  const createNewChat = () => {
    setChatId(null)
    userInputRef.current!.value = ''
    chatRef.current?.resetMessages()
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
        return;
      }
      localStorage.setItem('apiToken', apiToken || '')

      alert('Options are successfully saved.');
    });

    chatFormRef.current?.addEventListener('submit', async (e) => {
      e.preventDefault();
      let message = userInputRef.current?.value.trim();

      if (message) {
        const apiToken = localStorage.getItem('apiToken');

        if (apiToken) {
          gptApiClient.setApiKey(apiToken);
          if (modelSelectRef.current!.value) {
            const model = modelSelectRef.current!.value === 'gpt-4' ? Model.GPT4 : Model.GPT3_5_TURBO;
            gptApiClient.setModel(model);
          }
          try {
            spinnerRef.current?.classList.remove('hidden');
            if (message.includes('/sudo')) {
              const orphanElement = document.createElement('div');
              const sudoChat = new Chat(orphanElement)
              const existingMessages = chat.getMessages(gptApiClient.getModel());
              sudoChat.setMessages(existingMessages);
              await chat.appendMessage({
                sender: 'user',
                message
              });
              userInputRef.current!.value = '';
              sudoChat.appendMessage({
                sender: 'system',
                message: `
  I have made two functions that are already available in the global scope (do not repeat them in your response):

  async fetchPageAsMarkdown(url) -> scrapes the contents of the given url asynchronously and returns the relevant content "magically" if used with "await". The return value is a string containing the result of scraping the page and contains useful content that can be passed to askChatbotToPerformPromptOnContent. This function is capable of performing web scraping and data manipulation

  async askChatbotToPerformPromptOnContent(offlineQueryFromChatbot, markdownContent) -> sends offlineQueryFromChatbot followed by the markdownContent to a chatbot that's as capable as GPT-4, but is not connected to the web, so the source to get the data shouldn't be specified in offlineQueryFromChatbot

  Generate the suitable code for the following prompt. The code should be a composition of the two functions above. Remove any reference to a website name from the string passed to offlineQueryFromChatbot.

  Hint: The chatbot is capable of extracting any information from the markdownContent, it's just not capable of accessing web, and for that it uses the help from fetchPageAsMarkdown.

  Hint: The resulting code is the logic wrapped inside of an async function called executeChatbotLogic. The function should return the answer to the prompt. Do not add anything after the async function definition. DO NOT CALL THE executeChatbotLogic function (don't add 'executeChatbotLogic();' to the code). Do not use IIFE either.
                `
              })
              sudoChat.appendMessage({
                sender: 'user',
                message: message!.replace(/\/sudo/g, '')
              })
              let retriesLeft = modelSelectRef.current!.value === 'gpt-4' ? 2 : 5;
              while (retriesLeft-- > 0) {
                let prompt = await gptApiClient.chat(sudoChat.getMessages(gptApiClient.getModel()), {
                  temperature: 0.2
                })
                try {
                  // @ts-ignore
                  async function fetchPageAsMarkdown(url: string) {
                    return await fetch('/api/fetcher', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        url,
                        user: hash(localStorage.getItem('apiToken') || ''),
                      })
                    }).then(res => res.text())
                  }

                  // @ts-ignore
                  async function askChatbotToPerformPromptOnContent(offlineQueryFromChatbot: string, markdownContent: string) {
                    if (!markdownContent.trim()) {
                      throw new Error('No content')
                    }
                    return `The following content is downloaded from the website mentioned in the prompt in markdown format, use it to generate an answer to this prompt: '${offlineQueryFromChatbot}'. Do not The content (do not complain if the content is not complete):
                    
                    ${markdownContent}, `
                  }

                  if (prompt.includes('```')) {
                    prompt = prompt.split('```')[1]
                  }
                  const fn = (() => eval(`(
                    ${prompt}
                  )`))();
                  message = await fn();
                  if (!message) {
                    throw new Error('No message')
                  }
                  await chat.appendMessage({
                    sender: 'user',
                    hide: true,
                    message
                  });
                  break;
                } catch (e) {
                  console.error(e)
                  console.log(`Retrying... ${retriesLeft} retries left`)
                  continue;
                }
              }
              orphanElement.remove();
              if (retriesLeft <= 0) {
                await chat.appendMessage({
                  sender: 'assistant',
                  message: 'I am sorry but I am not able to solve this task. Please use a different prompt.'
                });
                spinnerRef.current?.classList.add('hidden');
                errorMessageRef.current!.classList.add('hidden')
                updateHistoryRef.current!(chat.getMessages(gptApiClient.getModel()));
                return;
              }
            } else {
              await chat.appendMessage({
                sender: 'user',
                message
              });
              userInputRef.current!.value = '';
            }

            const response = await gptApiClient.chat(chat.getMessages(gptApiClient.getModel()), {
              frequency_penalty: 2
            });
            await chat.appendMessage({
              sender: 'assistant',
              message: response
            });
            spinnerRef.current?.classList.add('hidden');
            errorMessageRef.current!.classList.add('hidden')
            updateHistoryRef.current!(chat.getMessages(gptApiClient.getModel()));
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
      onDelete={onHistoryDelete}
      onNewChatClick={createNewChat}
    >
      <h2 className="text-2xl text-gray-100 mb-5">GPT API Companion - Options</h2>
      <form ref={optionsFormRef} id="optionsForm" className="flex">
        <div>
          <label htmlFor="apiToken" className="block text-sm text-gray-100 mb-2">GPT API Token:</label>
          <input type="password" ref={apiTokenRef} id="apiToken" name="apiToken" className="w-full rounded p-2 border-gray-300 text-gray-800" />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 mt-4">Save</button>
        </div>
        <div className="ml-8 text-gray-100">
          Install the <a target='_blank' className="text-gray-400 hover:text-gray-500" href="https://chrome.google.com/webstore/detail/gpt-api-companion/bdaanmhmamgpeppfdajedeliilghopol">Chrome Extension</a>
        </div>
      </form>
      <hr className="my-5" />
      <h2 className="text-2xl text-gray-100 mb-5">Chat with GPT API Companion</h2>
      <div className="w-full mr-4 bg-white shadow-md rounded p-2 text-gray-800">
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
                    animation- delay: -.9s
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

                33.33 % {
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
      <div className="hidden bg-gray-50 bg-gray-100"></div>
      <script type="module" src="../dist/options.js"></script>
    </Dashboard>
  )
}
