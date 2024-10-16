import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  GlobeEuropeAfricaIcon,
  LockClosedIcon,
  MinusIcon,
  PlusIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Message } from "@/common/types";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Dashboard({
  history,
  chatId,
  onClick,
  onDelete,
  onNewChatClick,
  children,
}: {
  history: { id: string; messages: Message[] }[] | null;
  chatId: string | null;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChatClick: () => void;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!history) {
    return <>{children}</>;
  }

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
                          <li
                            onClick={onNewChatClick}
                            className="mt-auto flex justify-center"
                          >
                            <NewChatButton onClick={onNewChatClick} />
                          </li>
                          {history
                            .slice()
                            .reverse()
                            .map((item) => (
                              <li key={item.id}>
                                <div className="flex justify-between">
                                  <a
                                    onClick={() => onClick(item.id)}
                                    className={classNames(
                                      item.id === chatId
                                        ? "bg-gray-800 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800",
                                      "inline w-full group gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                    )}
                                  >
                                    {getTitle(item.messages, 30)}
                                  </a>
                                  <DeleteIcon
                                    onClick={() => onDelete(item.id)}
                                  />
                                </div>
                              </li>
                            ))}
                        </ul>
                        <div className="fixed bottom-0">
                          <BottomLinks />
                        </div>
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
        <div className="flex grow flex-col gap-y-5 bg-gray-900 px-6 overflow-y-auto">
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  <li className="flex mt-auto justify-center">
                    <NewChatButton onClick={onNewChatClick} />
                  </li>
                  {history
                    .slice()
                    .reverse()
                    .map((item) => (
                      <li key={item.id}>
                        <div className="flex justify-between">
                          <a
                            onClick={() => onClick(item.id)}
                            className={classNames(
                              item.id === chatId
                                ? "bg-gray-800 text-white"
                                : "text-gray-400 hover:text-white hover:bg-gray-800",
                              "inline w-full group gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                            )}
                          >
                            {getTitle(item.messages, 30)}
                          </a>
                          <DeleteIcon onClick={() => onDelete(item.id)} />
                        </div>
                      </li>
                    ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
        <BottomLinks />
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

      {children}
    </div>
  );
}

function DeleteIcon({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button onClick={onClick}>
      <MinusIcon
        className="inline mt-2 h-6 w-6 text-white"
        aria-hidden="true"
      />
    </button>
  );
}

function NewChatButton({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button onClick={onClick} className="flex items-end">
      <span className="text-gray-100 pt-4">New chat</span>
      <PlusIcon className="inline mt-2 h-6 w-6 text-white" aria-hidden="true" />
    </button>
  );
}

function BottomLinks(): JSX.Element {
  return (
    <div className="p-2 bg-gray-900">
      <a className="block text-lg" href="/options">
        <WrenchScrewdriverIcon className="inline w-4" /> Options
      </a>
      <a
        className="block text-lg"
        target="_blank"
        href="https://chrome.google.com/webstore/detail/gpt-api-companion/bdaanmhmamgpeppfdajedeliilghopol"
      >
        <GlobeEuropeAfricaIcon className="inline w-4" /> Chrome extension
      </a>
      <a className="block font-thin mt-2" href="/privacy-and-security">
        <LockClosedIcon className="inline w-4" /> End-to-end encrypted history
      </a>
    </div>
  );
}

function getTitle(messages: Message[], limit: number): string {
  const titleMessage =
    messages.find((message) => !message.hide && !(message as any).system) || {};
  const [sender] = Object.keys(titleMessage);
  return (titleMessage as any)[sender].slice(0, limit);
}
