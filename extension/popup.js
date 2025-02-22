document.addEventListener("DOMContentLoaded", async () => {
    const loginButton = document.getElementById("loginGithub");
    const saveButton = document.getElementById("saveSolution");
    const setupHookButton = document.getElementById("setupHook");
    const statusText = document.getElementById("status");
    const uriValue = document.getElementById("uriValue");

    console.log("✅ DOM Fully Loaded, Initializing Script...");
    uriValue.textContent = chrome.identity.getRedirectURL();

    const GITHUB_CLIENT_ID = "Ov23lifxi8XMbqm0Zdsa";
    const REDIRECT_URI = "https://emppmgemkbjiojiblefmidpoichmbggg.chromiumapp.org";
    const BACKEND_URL = "http://localhost:8080";

    // Check if GitHub Token and Selected Repo are Saved
    const result = await chrome.storage.sync.get(["githubAccessToken", "selectedRepo"]);
    if (result.githubAccessToken) {
        console.log("✅ GitHub Token Found! Auto-Logging In...");
        loginButton.style.display = "none";
        if (result.selectedRepo) {
            setupHookButton.style.display = "none";
            saveButton.style.display = "block";
            statusText.innerText = `Logged in, selected repo: ${result.selectedRepo}`;
        } else {
            setupHookButton.style.display = "block";
            statusText.innerText = "Logged in, please setup hook";
        }
    } else {
        console.warn("❌ GitHub Token NOT Found! Please log in.");
        statusText.innerText = "Not Logged In! Please login first.";
    }

    // GitHub Login Process
    loginButton?.addEventListener("click", () => {
        console.log("🔗 Initiating GitHub OAuth...");
        statusText.innerText = "Redirecting to GitHub...";
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo&response_type=code`;

        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, async (redirectUrl) => {
            if (chrome.runtime.lastError) {
                console.error("❌ OAuth Error:", chrome.runtime.lastError);
                statusText.innerText = "OAuth Error!";
                return;
            }
            const url = new URL(redirectUrl);
            const code = url.searchParams.get("code");
            if (code) {
                try {
                    const response = await axios.get(`${BACKEND_URL}/emppmgemkbjiojiblefmidpoichmbggg.chromiumapp.org`, { params: { code } });
                    const data = response.data;
                    if (data.success && data.access_token) {
                        chrome.storage.sync.set({ githubAccessToken: data.access_token }, () => {
                            console.log("✅ GitHub Access Token Stored!");
                            loginButton.style.display = "none";
                            setupHookButton.style.display = "block";
                            statusText.innerText = "Logged in to GitHub";
                        });
                    }
                } catch (error) {
                    console.error("❌ Error fetching token:", error);
                    statusText.innerText = "Login Failed!";
                }
            }
        });
    });

    // Setup Hook Button Click
    setupHookButton?.addEventListener("click", async () => {
        const token = await chrome.storage.sync.get("githubAccessToken");
        if (!token.githubAccessToken) {
            alert("Please log in first.");
            return;
        }
        statusText.innerText = "Fetching repositories...";
        try {
            const response = await axios.get("https://api.github.com/user/repos", {
                headers: {
                    Authorization: `Bearer ${token.githubAccessToken}`,
                    Accept: "application/vnd.github.v3+json"
                }
            });
            const repos = response.data;
            console.log("✅ Repositories Fetched:", repos.length);

            const select = document.createElement("select");
            select.id = "repoSelect";
            repos.forEach(repo => {
                const option = document.createElement("option");
                option.value = repo.full_name;
                option.text = repo.full_name;
                select.appendChild(option);
            });

            const confirmButton = document.createElement("button");
            confirmButton.textContent = "Select Repository";
            confirmButton.addEventListener("click", () => {
                const selectedRepo = select.value;
                if (selectedRepo) {
                    chrome.storage.sync.set({ selectedRepo }, () => {
                        console.log("✅ Repository Selected:", selectedRepo);
                        alert("Repository selected: " + selectedRepo);
                        setupHookButton.style.display = "none";
                        saveButton.style.display = "block";
                        statusText.innerText = `Selected repo: ${selectedRepo}`;
                        document.body.removeChild(select);
                        document.body.removeChild(confirmButton);
                    });
                }
            });

            document.body.appendChild(select);
            document.body.appendChild(confirmButton);
            statusText.innerText = "Please select a repository.";
        } catch (error) {
            console.error("❌ Error fetching repositories:", error);
            alert("Failed to fetch repositories.");
            statusText.innerText = "Error fetching repositories.";
        }
    });

    // Save Solution Button Click
   saveButton?.addEventListener("click", async () => {
    console.log("✅ Save Solution Button Clicked!");
    statusText.innerText = "Fetching solution from LeetCode...";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("Active tab:", tab.url);
    if (!tab || !tab.url.includes("leetcode.com/problems")) {
        console.error("❌ Not on a LeetCode problem page!");
        alert("Error: Please open a LeetCode problem page!");
        return;
    }

    try {
        const response = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: "save_solution" }, (resp) => {
                if (chrome.runtime.lastError) {
                    console.error("❌ Chrome Runtime Error:", chrome.runtime.lastError.message);
                    resolve({ status: "error", message: chrome.runtime.lastError.message });
                } else {
                    console.log("✅ Response from content script:", resp);
                    resolve(resp);
                }
            });
        });

        if (response.status !== "success") {
            console.error("❌ Failed to extract solution:", response.message);
            alert("Error: " + (response.message || "Failed to extract solution!"));
            return;
        }

        console.log("✅ Solution Extracted Successfully:", response);
        statusText.innerText = "Solution extracted! Uploading to GitHub...";

        const { title, number, code, language } = response;
        const problemTitle = title.replace(/[^a-zA-Z0-9_]/g, "_") || "Unknown_Problem";
        const problemNumber = number || "000";
        const codeContent = code?.trim();

        if (!codeContent) {
            alert("Error: No code content found!");
            return;
        }

        // Map language to file extension (must match backend expectations)
        const extensionMap = {
            "cpp": "cpp",
            "java": "java",
            "py": "py",
            "js": "js"
        };
        const fileExtension = extensionMap[language];
        if (!fileExtension) {
            console.error("❌ Unsupported language:", language);
            alert("Error: Unsupported language detected!");
            return;
        }

        const fileName = `${problemNumber}_${problemTitle}.${fileExtension}`;

        const { githubAccessToken, selectedRepo } = await chrome.storage.sync.get(["githubAccessToken", "selectedRepo"]);
        if (!githubAccessToken || !selectedRepo) {
            alert("Error: Authentication or repository selection required!");
            return;
        }

        console.log("✅ Uploading to GitHub via Backend...");
        const saveResponse = await axios.post(`${BACKEND_URL}/save`, {
            access_token: githubAccessToken,
            filename: fileName,
            content: codeContent,
            repo: selectedRepo
        });
        const saveData = saveResponse.data;
        if (saveData.message) {
            console.log("✅ Solution Saved:", saveData.message);
            statusText.innerText = "Solution Saved on GitHub!";
            alert("Solution Saved on GitHub!");
        }
    } catch (error) {
        console.error("❌ Error uploading to GitHub:", error);
        statusText.innerText = "Error uploading solution.";
        alert("Error: " + (error.response?.data.error || error.message));
    }
});
});