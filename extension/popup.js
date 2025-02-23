document.addEventListener("DOMContentLoaded", async () => {
    const loginButton = document.getElementById("loginGithub");
    const saveButton = document.getElementById("saveSolution");
    const setupHookButton = document.getElementById("setupHook");
    const setupHookDescription = document.getElementById("setupHookDescription");
    const loginDescription = document.getElementById("loginDescription");
    // const logoutButton = document.getElementById("logoutButton");
    const title = document.getElementById("title");
    const statusText = document.getElementById("status");
    // const uriValue = document.getElementById("uriValue");
    const modal = document.getElementById("repoContainer"); // Get modal reference

    console.log("✅ DOM Fully Loaded, Initializing Script...");
    // uriValue.textContent = chrome.identity.getRedirectURL();

    // Ensure modal is hidden on initial load
    if (modal) {
        modal.style.display = "none";
    }

    const GITHUB_CLIENT_ID = "Ov23lifxi8XMbqm0Zdsa";
    const REDIRECT_URI = "https://emppmgemkbjiojiblefmidpoichmbggg.chromiumapp.org";
    const BACKEND_URL = "http://localhost:8080";

    const updateUI = (token, repo) => {
        if (token) {
            loginButton.style.display = "none";
            loginDescription.style.display = "none";
            // logoutButton.style.display = "inline-block";
            title.classList.add("logged-in");
            if (repo) {
                setupHookButton.style.display = "none";
                setupHookDescription.style.display = "none"; // Hide setup hook description
                saveButton.style.display = "block";
                statusText.innerText = `Logged in, selected repo: ${repo}`;
            } else {
                setupHookButton.style.display = "block";
                setupHookDescription.style.display = "block"; // Show setup hook description
                saveButton.style.display = "none";
                statusText.innerText = "Logged in, please setup hook";
            }
        } else {
            loginButton.style.display = "block";
            loginDescription.style.display = "block"; // Show authenticate description
            logoutButton.style.display = "none";
            setupHookButton.style.display = "none";
            setupHookDescription.style.display = "none"; // Hide setup hook description
            saveButton.style.display = "none";
            statusText.innerText = "Not Logged In! Please login first.";
        }
    };

    const result = await chrome.storage.sync.get(["githubAccessToken", "selectedRepo"]);
    if (result.githubAccessToken) {
        console.log("✅ GitHub Token Found! Auto-Logging In...");
        updateUI(result.githubAccessToken, result.selectedRepo);
    } else {
        console.warn("❌ GitHub Token NOT Found! Please log in.");
        updateUI(null, null);
    }

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
                            updateUI(data.access_token, null);
                        });
                    }
                } catch (error) {
                    console.error("❌ Error fetching token:", error);
                    statusText.innerText = "Login Failed!";
                }
            }
        });
    });

    // Repository Selection - Only triggers on button click
    setupHookButton?.addEventListener("click", async () => {
        const token = await chrome.storage.sync.get("githubAccessToken");
        if (!token.githubAccessToken) {
            alert("Please log in first.");
            return;
        }
        statusText.innerText = "Fetching repositories...";

        const repoGrid = document.getElementById("repoGrid");
        const repoSearch = document.getElementById("repoSearch");
        const confirmRepoBtn = document.getElementById("confirmRepo");
        let selectedRepo = null;

        try {
            const fetchRepos = async (page = 1, perPage = 100) => {
                const response = await axios.get("https://api.github.com/user/repos", {
                    headers: {
                        Authorization: `Bearer ${token.githubAccessToken}`,
                        Accept: "application/vnd.github.v3+json"
                    },
                    params: {
                        per_page: perPage,
                        page: page,
                        sort: "updated",
                        direction: "desc"
                    }
                });
                return response.data;
            };

            repoGrid.innerHTML = ""; // Clear existing content
            const repos = await fetchRepos();
            console.log("✅ Repositories Fetched:", repos.length);

            repos.forEach(repo => {
                const repoCard = document.createElement("div");
                repoCard.className = "repo-card";
                repoCard.innerHTML = `
                    <h3>${repo.name}</h3>
                    <p>${repo.description || "No description"}</p>
                    <p>${repo.private ? "Private" : "Public"} • ${repo.size} KB • Updated: ${new Date(repo.updated_at).toLocaleDateString()}</p>
                `;
                repoCard.addEventListener("click", () => {
                    document.querySelectorAll(".repo-card").forEach(card => card.classList.remove("selected"));
                    repoCard.classList.add("selected");
                    selectedRepo = repo.full_name;
                    confirmRepoBtn.disabled = false;
                });
                repoGrid.appendChild(repoCard);
            });

            modal.style.display = "flex"; // Show modal only when button is clicked
            statusText.innerText = "Please select a repository.";

            repoSearch.addEventListener("input", (e) => {
                const searchTerm = e.target.value.toLowerCase();
                document.querySelectorAll(".repo-card").forEach(card => {
                    const repoName = card.querySelector("h3").textContent.toLowerCase();
                    card.style.display = repoName.includes(searchTerm) ? "block" : "none";
                });
            });

            document.getElementById("closeModal").addEventListener("click", () => {
                modal.style.display = "none";
                statusText.innerText = "Logged in, please setup hook";
            });

            confirmRepoBtn.addEventListener("click", () => {
                if (selectedRepo) {
                    chrome.storage.sync.set({ selectedRepo }, () => {
                        console.log("✅ Repository Selected:", selectedRepo);
                        alert("Repository selected: " + selectedRepo);
                        updateUI(token.githubAccessToken, selectedRepo);
                        modal.style.display = "none";
                    });
                }
            });

        } catch (error) {
            console.error("❌ Error fetching repositories:", error);
            alert("Failed to fetch repositories: " + error.message);
            statusText.innerText = "Error fetching repositories.";
            modal.style.display = "none";
        }
    });

    title?.addEventListener("click", () => {
        console.log("🔒 Logging out...");
        chrome.storage.sync.remove(["githubAccessToken", "selectedRepo"], () => {
            console.log("✅ Logged out! Cleared GitHub token and selected repo.");
            updateUI(null, null);
            statusText.innerText = "Logged out successfully!";
        });
    });

    saveButton?.addEventListener("click", async () => {
        console.log("✅ Save Solution Button Clicked!");
        statusText.innerText = "Fetching solution from LeetCode...";

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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