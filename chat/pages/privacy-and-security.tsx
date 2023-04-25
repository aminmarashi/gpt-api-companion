import Head from "next/head";

export default function PrivacyAndSecurity() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Privacy and security</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="py-10 lg:pl-72 min-h-screen">
        <div className="container px-4 sm:px-6 lg:px-8">
          <h1 className="text-6xl font-bold">
            Privacy and security
          </h1>
          <div className="m-6 border-t-2 border-gray-300"></div>
          <h2 className="text-2xl font-bold">
            API Token
          </h2>
          <p className="mt-3 text-2xl">
            Your API token is stored in your browser's local storage.
            This app never stores your API token on the server-side, but it does store a hash of your token which is used to identify you to make chat history work.
          </p>
          <div className="m-6 border-t-2 border-gray-300"></div>
          <h2 className="text-2xl font-bold">
            Chat history
          </h2>
          <p className="mt-3 text-2xl">
            All of your chat history is end-to-end encrypted using your API token. <strong>Beware!</strong> If you lose your API token you will also lose your chat history.
            If you want to change your API token, make sure to set the current one first to decrypt your chat history. Then replace it with a new one.
            <strong>Existing unencrypted messages</strong> might exist in the history database, the next time you login to the app it will try to encrypt all of them.
          </p>
          <div className="m-6 border-t-2 border-gray-300"></div>
          <h2 className="text-2xl font-bold">
            OpenAI Policies
          </h2>
          <p className="mt-3 text-2xl">
            This app is not affiliated with OpenAI in any way. This app is not endorsed by OpenAI. In order to learn about how OpenAI uses your data please refer to their <a href="https://openai.com/policies/privacy-policy" target="_blank" className="text-blue-500">policies</a>.
          </p>
          <div className="m-6 border-t-2 border-gray-300"></div>
          <h2 className="text-2xl font-bold">
            Report a bug
          </h2>
          <p className="mt-3 text-2xl">
            If you find a bug or have a feature request, please open an issue on <a href="https://github.com/aminmarashi/gpt-api-companion">GitHub</a>.
          </p>
        </div>
      </main>
    </div>
  )
}