const BACKEND_URL = "http://localhost:8080/save"; // Go backend URL

function pushToBackend(accessToken, repo, filename, content) {
    return fetch(BACKEND_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            access_token: accessToken,
            repo: repo,
            filename: filename,
            content: content,
        }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error || "Backend request failed");
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("✅ Backend Response:", data); // Important success log
        return { status: "success", message: data.message || "Solution saved to GitHub" };
    })
    .catch(error => {
        console.error("❌ Error pushing to backend:", error); // Important error log
        return { status: "error", message: `Failed to save solution: ${error.message}` };
    });
}

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
        const response = await pushToBackend(githubAccessToken, selectedRepo, filename, code);
        sendResponse(response);
    });

    return true; 
});