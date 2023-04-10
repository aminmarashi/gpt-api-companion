document.addEventListener("DOMContentLoaded", () => {
  const optionsForm = document.getElementById("options-form") as HTMLFormElement;
  const apiTokenField = document.getElementById("api-token") as HTMLInputElement;

  // Load the saved API token
  chrome.storage.sync.get("apiToken", ({ apiToken }) => {
    apiTokenField.value = apiToken || "";
  });

  // Save the API token
  optionsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const apiToken = apiTokenField.value.trim();

    chrome.storage.sync.set({ apiToken }, () => {
      alert("API Token saved.");
    });
  });
});
