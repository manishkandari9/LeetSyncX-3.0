document.addEventListener("DOMContentLoaded", async () => {
    const loginButton = document.getElementById("loginGithub");
    const setupHookButton = document.getElementById("setupHook");
    const setupHookDescription = document.getElementById("setupHookDescription");
    const loginDescription = document.getElementById("loginDescription");
    const title = document.getElementById("title");
    const syncMessage = document.getElementById("syncMessage");
    const repoName = document.getElementById("repoName");
    const problemsSolved = document.getElementById("problemsSolved");
    const difficultyContainer = document.querySelector(".difficulty-container");
    const easyBtn = document.getElementById("easyBtn");
    const mediumBtn = document.getElementById("mediumBtn");
    const hardBtn = document.getElementById("hardBtn");
    const featureRequest = document.getElementById("featureRequest");
    const modal = document.getElementById("repoContainer");

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
            title.classList.add("logged-in");
            if (repo) {
                setupHookButton.style.display = "none";
                setupHookDescription.style.display = "none";
                syncMessage.textContent = "Sync your code from LeetCode to GitHub";
                repoName.textContent = repo;
                repoName.style.display = "block";
                problemsSolved.textContent = "Problems Solved: 0";
                problemsSolved.style.display = "block";
                difficultyContainer.style.display = "flex";
                easyBtn.style.display = "inline-block";
                mediumBtn.style.display = "inline-block";
                hardBtn.style.display = "inline-block";
                featureRequest.style.display = "block";
            } else {
                setupHookButton.style.display = "block";
                setupHookDescription.style.display = "block";
                syncMessage.textContent = "Logged in, please setup hook";
                repoName.style.display = "none";
                problemsSolved.style.display = "none";
                difficultyContainer.style.display = "none";
                featureRequest.style.display = "none";
            }
        } else {
            loginButton.style.display = "block";
            loginDescription.style.display = "block";
            title.classList.remove("logged-in");
            setupHookButton.style.display = "none";
            setupHookDescription.style.display = "none";
            syncMessage.textContent = "Not Logged In! Please login first.";
            repoName.style.display = "none";
            problemsSolved.style.display = "none";
            difficultyContainer.style.display = "none";
            featureRequest.style.display = "none";
        }
    };

    const result = await chrome.storage.sync.get(["githubAccessToken", "selectedRepo"]);
    updateUI(result.githubAccessToken, result.selectedRepo);

    loginButton?.addEventListener("click", () => {
        syncMessage.textContent = "Redirecting to GitHub...";
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo&response_type=code`;

        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, async (redirectUrl) => {
            if (chrome.runtime.lastError) {
                console.error("❌ OAuth Error:", chrome.runtime.lastError);
                syncMessage.textContent = "OAuth Error!";
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
                    syncMessage.textContent = "Login Failed!";
                }
            }
        });
    });

    setupHookButton?.addEventListener("click", async () => {
        const token = await chrome.storage.sync.get("githubAccessToken");
        if (!token.githubAccessToken) {
            alert("Please log in first.");
            return;
        }
        syncMessage.textContent = "Fetching repositories...";

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

            repoGrid.innerHTML = "";
            const repos = await fetchRepos();

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

            modal.style.display = "flex";
            syncMessage.textContent = "Please select a repository.";

            repoSearch.addEventListener("input", (e) => {
                const searchTerm = e.target.value.toLowerCase();
                document.querySelectorAll(".repo-card").forEach(card => {
                    const repoName = card.querySelector("h3").textContent.toLowerCase();
                    card.style.display = repoName.includes(searchTerm) ? "block" : "none";
                });
            });

            document.getElementById("closeModal").addEventListener("click", () => {
                modal.style.display = "none";
                syncMessage.textContent = "Logged in, please setup hook";
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
            console.error("Error fetching repositories:", error);
            alert("Failed to fetch repositories: " + error.message);
            syncMessage.textContent = "Error fetching repositories.";
            modal.style.display = "none";
        }
    });

    title?.addEventListener("click", () => {
        if (title.classList.contains("logged-in")) {
            chrome.storage.sync.remove(["githubAccessToken", "selectedRepo"], () => {
                updateUI(null, null);
            });
        }
    });
});