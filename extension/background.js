// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== "push_solution") {
    sendResponse({ status: "error", message: "Invalid action" });
    return true;
  }

  const { title, code, language } = message.solution;
  if (!title || !code || !language) {
    sendResponse({ status: "error", message: "Incomplete solution data" });
    return true;
  }

  chrome.storage.sync.get(["githubAccessToken", "selectedRepo"], async (result) => {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError.message);
      sendResponse({ status: "error", message: "Failed to access storage" });
      return;
    }

    const { githubAccessToken, selectedRepo } = result;
    if (!githubAccessToken || !selectedRepo) {
      sendResponse({ status: "error", message: "Not authenticated or repo not selected" });
      return;
    }

    const filename = `${title}${language}`;
    try {
      const response = await pushToGitHub(githubAccessToken, selectedRepo, filename, code);
      sendResponse(response);
    } catch (error) {
      console.error("Error pushing to GitHub:", error);
      sendResponse({ status: "error", message: `Failed to save solution: ${error.message}` });
    }
  });

  return true; // Keep the message channel open for async response
});

async function pushToGitHub(accessToken, repo, fileName, content) {
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(fileName)}`;
  const encodedContent = btoa(unescape(encodeURIComponent(content))); // Base64 encode

  let sha = "";
  try {
    const getResponse = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (getResponse.status === 200) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    } else if (getResponse.status !== 404) {
      throw new Error(`GitHub API error: ${getResponse.status}`);
    }
  } catch (error) {
    console.warn("File does not exist, proceeding without SHA:", error);
  }

  const requestBody = {
    message: `Auto-sync LeetsyncX solution: ${fileName}`,
    content: encodedContent,
  };
  if (sha) requestBody.sha = sha;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `GitHub API request failed: ${response.status}`);
  }

  console.log("Successfully pushed to GitHub:", fileName);
  return { status: "success", message: "Solution saved to GitHub" };
}