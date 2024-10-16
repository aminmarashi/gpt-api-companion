import "highlight.js/styles/atom-one-dark.css";
import { useEffect, useRef, useState } from "react";
import { Chat } from "../common/Chat";
import { Message, Model } from "../common/types";
import gptApiClient from "../common/apiClient";
import Dashboard from "@/components/Dashboard";
import { AES, SHA256, enc } from "crypto-js";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { getGPTModel } from "@/common/utils";

function hash(str: string) {
  return SHA256(str).toString();
}

function encryptMessage(message: string, apiKey: string) {
  return AES.encrypt(message, apiKey).toString();
}

function decryptMessage(encryptedMessage: string, apiKey: string) {
  return AES.decrypt(encryptedMessage, apiKey).toString(enc.Utf8);
}

function encryptMessages(messages: Message[], key: string) {
  return messages.map((message) => {
    const [sender] = Object.keys(message);
    const encryptedMessage = encryptMessage((message as any)[sender], key);
    return {
      ...message,
      [sender]: encryptedMessage,
      encrypted: true,
    };
  });
}

function decryptHistory(historyList: History[], key: string) {
  return historyList.map((history) => {
    const decryptedMessages = decryptMessages(history.messages, key);
    return {
      ...history,
      messages: decryptedMessages,
    };
  });
}

function decryptMessages(messages: Message[], key: string) {
  return messages.map((message) => {
    if (!message.encrypted) {
      return message;
    }
    const [sender] = Object.keys(message);
    const decryptedMessage = decryptMessage((message as any)[sender], key);
    return {
      ...message,
      [sender]: decryptedMessage,
      encrypted: false,
    };
  });
}

type History = {
  id: string;
  messages: Message[];
};

export default function Home() {
  const chatFormRef = useRef<HTMLFormElement>(null);
  const userInputRef = useRef<HTMLTextAreaElement>(null);
  const chatElementRef = useRef<HTMLDivElement>(null);
  const modelSelectRef = useRef<HTMLSelectElement>(null);

  const [history, setHistory] = useState<History[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoadingOriginal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const updateHistoryRef = useRef<((messages: Message[]) => void) | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const cancellablesRef = useRef<((reason: "cancelled") => void)[]>([]);
  const isLoadingRef = useRef<boolean>(false);

  const setIsLoading = (isLoading: boolean) => {
    isLoadingRef.current = isLoading;
    setIsLoadingOriginal(isLoading);
  };

  const onHistoryClick = (id: string) => {
    setChatId(id);
    const messages = history.find((h) => h.id === id)?.messages;
    if (messages) {
      chatRef.current!.setMessages(messages);
    }
  };

  const onHistoryDelete = (id: string) => {
    const apiToken = localStorage.getItem("apiToken") || "";
    fetch(`/api/history?user=${hash(apiToken)}&id=${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setErrorMessage(data.error);
          return;
        }
        setHistory(decryptHistory(data, apiToken));
      });
  };

  updateHistoryRef.current = async (messages: Message[]) => {
    const apiToken = localStorage.getItem("apiToken") || "";
    const data: History[] | { error: string } = await fetch("/api/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: hash(apiToken),
        id: chatId,
        messages: encryptMessages(messages, apiToken),
      }),
    }).then((res) => res.json());
    if ("error" in data) {
      setErrorMessage(data.error);
      return;
    }
    setChatId(data.slice(-1)[0].id);
    setHistory(decryptHistory(data, apiToken));
  };

  const fetchHistory = async () => {
    const apiToken = localStorage.getItem("apiToken") || "";
    const data: History[] | { error: string } = await fetch(
      `/api/history?user=${hash(apiToken)}`,
      {
        method: "GET",
      }
    ).then((res) => res.json());
    if ("error" in data) {
      setErrorMessage(data.error);
      return;
    }
    // TODO: Remove once all chat history is encrypted
    for (const history of data) {
      const messages = history.messages;
      const chatId = history.id;
      if (!messages.find((m) => m.encrypted)) {
        try {
          await fetch("/api/history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user: hash(apiToken),
              id: chatId,
              messages: encryptMessages(messages, apiToken),
            }),
          });
        } catch (e) {
          console.error(e);
          setErrorMessage(
            "Unable to encrypt messages in history, please manually open and modify a chat history to encrypt it."
          );
        }
      }
    }
    setHistory(decryptHistory(data, apiToken));
  };

  const createNewChat = () => {
    setChatId(null);
    userInputRef.current!.value = "";
    chatRef.current?.resetMessages();
  };

  const cancel = () => {
    for (const cancellable of cancellablesRef.current) {
      cancellable("cancelled");
    }
  };

  const cleanUp = () => {
    clearCancellables();
    setIsLoading(false);
  };

  function cancellable<T>(promise: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      promise.then(resolve, reject);
      cancellablesRef.current.push(reject);
    });
  }

  function clearCancellables() {
    cancellablesRef.current = [];
  }

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
    } else {
      return;
    }

    chatRef.current = new Chat(chatElementRef.current!);
    const chat = chatRef.current;

    fetchHistory();

    userInputRef.current?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        chatFormRef.current?.dispatchEvent(new Event("submit"));
      }
    });

    chatFormRef.current?.addEventListener("submit", async (e) => {
      e.preventDefault();
      let message = userInputRef.current?.value.trim();

      if (isLoadingRef.current) {
        cancel();
        return cleanUp();
      }

      if (!message) {
        return cleanUp();
      }

      const apiToken = localStorage.getItem("apiToken");

      if (!apiToken) {
        if (
          window.confirm(
            "Please set your OpenAI API Token in the Options page."
          )
        ) {
          window.location.href = `${window.location.origin}/options`;
        }
        return cleanUp();
      }

      gptApiClient.setApiKey(apiToken);
      if (modelSelectRef.current!.value) {
        gptApiClient.setModel(getGPTModel(modelSelectRef.current!.value));
      }
      try {
        setIsLoading(true);
        await chat.appendMessage({
          sender: "user",
          message,
        });
        userInputRef.current!.value = "";
        let response = await cancellable(
          gptApiClient.chat(chat.getMessages(gptApiClient.getModel()))
        );
        await chat.appendMessage({
          sender: "assistant",
          message: response.content,
        });
        setErrorMessage(null);
        await updateHistoryRef.current!(
          chat.getMessages(gptApiClient.getModel())
        );
      } catch (err) {
        if (err === "cancelled") {
          return cleanUp();
        }
        console.error(err);
        setErrorMessage((err as Error).message);
      } finally {
        cleanUp();
      }
    });
  }, [initialized]);

  return (
    <Dashboard
      history={history}
      chatId={chatId}
      onClick={onHistoryClick}
      onDelete={onHistoryDelete}
      onNewChatClick={createNewChat}
    >
      <main className="flex py-4 lg:pl-72 bg-gray-700 min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
        <div className="w-full flex flex-col justify-stretch px-4 sm:px-6 lg:px-8">
          <div
            ref={chatElementRef}
            id="chat"
            className="w-full h-full overflow-y-scroll p-4 mr-4 bg-white shadow-md rounded p-2 text-gray-800"
          >
            {/* Chat will be added here dynamically */}
          </div>
          <div className="w-full">
            <div
              className={
                "mb-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" +
                (errorMessage ? "" : " hidden")
              }
            >
              {errorMessage}
            </div>
            <div className="bg-white shadow-md rounded p-4">
              <form ref={chatFormRef} id="chatForm">
                <textarea
                  ref={userInputRef}
                  id="userInput"
                  className="w-full rounded p-2 border-gray-300 text-gray-800"
                  placeholder="Type your message..."
                ></textarea>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 mt-2"
                >
                  <span className={"mr-1" + (isLoading ? "" : " hidden")}>
                    <svg
                      className="inline w-4 h-4"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        className="spinner_jCIR"
                        x="1"
                        y="6"
                        fill="white"
                        width="2.8"
                        height="12"
                      />
                      <rect
                        className="spinner_jCIR spinner_upm8"
                        fill="white"
                        x="5.8"
                        y="6"
                        width="2.8"
                        height="12"
                      />
                      <rect
                        className="spinner_jCIR spinner_2eL5"
                        fill="white"
                        x="10.6"
                        y="6"
                        width="2.8"
                        height="12"
                      />
                      <rect
                        className="spinner_jCIR spinner_Rp9l"
                        fill="white"
                        x="15.4"
                        y="6"
                        width="2.8"
                        height="12"
                      />
                      <rect
                        className="spinner_jCIR spinner_dy3W"
                        fill="white"
                        x="20.2"
                        y="6"
                        width="2.8"
                        height="12"
                      />
                    </svg>
                  </span>
                  {isLoading ? "Cancel" : "Send"}
                </button>
                {/* a drop down to select the GPT model */}
                <select
                  ref={modelSelectRef}
                  id="model"
                  className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow m-2"
                >
                  {Object.values(Model).map((model) => (
                    <option value={model} key={model}>
                      {model}
                    </option>
                  ))}
                </select>
                Read more about&nbsp;
                <a
                  href="https://platform.openai.com/docs/models"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GPT models
                </a>
              </form>
            </div>
          </div>
          <div className="hidden bg-gray-50 bg-gray-100"></div>
        </div>
      </main>
    </Dashboard>
  );
}
