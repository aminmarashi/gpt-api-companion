import { useEffect, useRef, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowLeftIcon,
  Bars3Icon,
  LockClosedIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Model } from "@/common/types";

export default function Options() {
  const optionsFormRef = useRef<HTMLFormElement>(null);
  const apiTokenRef = useRef<HTMLInputElement>(null);
  const defaultModelRef = useRef<HTMLSelectElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
    } else {
      return;
    }

    apiTokenRef.current!.value = localStorage.getItem("apiToken") || "";
    defaultModelRef.current!.value = localStorage.getItem("defaultModel") || "";

    optionsFormRef.current?.addEventListener("submit", (e) => {
      e.preventDefault();
      const apiToken = apiTokenRef.current?.value.trim();
      if (!apiToken) {
        alert("Please enter a valid GPT API Token.");
        return;
      }
      localStorage.setItem("apiToken", apiToken || "");

      const defaultModel = defaultModelRef.current?.value.trim();
      if (!defaultModel) {
        alert("Please select a default model.");
        return;
      }
      localStorage.setItem("defaultModel", defaultModel || "");

      alert("Options are successfully saved.");
    });
  }, [initialized]);

  return (
    <div>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-2 ring-1 ring-white/10">
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          <li className="flex mt-auto justify-center">
                            <a href="/" className="flex items-end">
                              <ArrowLeftIcon
                                className="inline mt-2 h-6 w-6 text-white"
                                aria-hidden="true"
                              />
                              <span className="text-gray-100 pt-4 ml-1">
                                Back to chat
                              </span>
                            </a>
                          </li>
                        </ul>
                      </li>
                      <li className="mt-auto py-8 flex justify-center">
                        <a className="font-thin" href="/privacy-and-security">
                          <LockClosedIcon className="inline w-4" /> End-to-end
                          encrypted history
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6">
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  <li className="flex mt-auto justify-center">
                    <a href="/" className="flex items-end">
                      <ArrowLeftIcon
                        className="inline mt-2 h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                      <span className="text-gray-100 pt-4 ml-1">
                        Back to chat
                      </span>
                    </a>
                  </li>
                </ul>
              </li>
              <li className="mt-auto py-8 flex justify-center">
                <a className="font-thin" href="/privacy-and-security">
                  <LockClosedIcon className="inline w-4" /> End-to-end encrypted
                  history
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-gray-900 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-400 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-white">
          Dashboard
        </div>
      </div>

      <main className="py-10 lg:pl-72 bg-gray-700 min-h-screen">
        <div className="container px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl text-gray-100 mb-5">
            GPT API Companion - Options
          </h2>
          <form ref={optionsFormRef} id="optionsForm" className="flex">
            <div>
              <label
                htmlFor="apiToken"
                className="block text-sm text-gray-100 mb-2"
              >
                GPT API Token:
              </label>
              <input
                type="password"
                ref={apiTokenRef}
                id="apiToken"
                name="apiToken"
                className="w-full rounded p-2 border-gray-300 text-gray-800"
              />
              <label
                htmlFor="defaultModel"
                className="block text-sm text-gray-100 mb-2"
              >
                Default GPT Model
              </label>
              <select
                ref={defaultModelRef}
                id="defaultModel"
                name="defaultModel"
                className="w-full rounded p-2 border-gray-300 text-gray-800"
                defaultValue={Model.GPT_4O}
                defaultChecked={true}
              >
                {Object.values(Model).map((model) => (
                  <option value={model} key={model}>
                    {model}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 mt-4"
              >
                Save
              </button>
            </div>
            <div className="ml-8 text-gray-100">
              Install the{" "}
              <a
                target="_blank"
                className="text-gray-400 hover:text-gray-500"
                href="https://chrome.google.com/webstore/detail/gpt-api-companion/bdaanmhmamgpeppfdajedeliilghopol"
              >
                Chrome Extension
              </a>
            </div>
          </form>
        </div>
        <a href="/" className="ml-8 mt-4 flex items-end">
          <ArrowLeftIcon
            className="inline mt-2 h-6 w-6 text-white"
            aria-hidden="true"
          />
          <span className="text-gray-100 pt-4 ml-1">Back to chat</span>
        </a>
      </main>
    </div>
  );
}
