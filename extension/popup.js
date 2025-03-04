document.addEventListener("DOMContentLoaded", async () => {
    const loginButton = document.getElementById("loginGithub");
    const setupHookButton = document.getElementById("setupHook");
    const setupHookDescription = document.getElementById("setupHookDescription");
    const loginDescription = document.getElementById("loginDescription");
    const logoutButton = document.getElementById("logoutButton");
    const syncMessage = document.getElementById("syncMessage");
    const repoName = document.getElementById("repoName");
    const problemsSolved = document.getElementById("problemsSolved");
    const difficultyContainer = document.querySelector(".difficulty-container");
    const easyBtn = document.getElementById("easyBtn");
    const mediumBtn = document.getElementById("mediumBtn");
    const hardBtn = document.getElementById("hardBtn");
    const modal = document.getElementById("repoContainer");
    const statuscard = document.getElementById("status-card");
    const badgesgrid =document.getElementById("badges-grid")

    if (modal) {
        modal.style.display = "none";
    }

    const GITHUB_CLIENT_ID = "Ov23lifxi8XMbqm0Zdsa";
    const REDIRECT_URI = "https://emppmgemkbjiojiblefmidpoichmbggg.chromiumapp.org";
    const BACKEND_URL = "http://localhost:8080";

    const leetSyncUpdateUI = (token, repo) => {
        if (token) {
            loginButton.style.display = "none";
            loginDescription.style.display = "none";
            logoutButton.style.display = "block";
            if (repo) {
                setupHookButton.style.display = "none";
                setupHookDescription.style.display = "none";
                syncMessage.textContent = "Sync your code from LeetCode to GitHub";
                repoName.textContent = repo;
                repoName.style.display = "block";
                problemsSolved.style.display = "block";
                difficultyContainer.style.display = "flex";
                easyBtn.style.display = "inline-block";
                mediumBtn.style.display = "inline-block";
                hardBtn.style.display = "inline-block";
                statuscard.style.display = "block";
                badgesgrid.style.display = "block";
            } else {
                setupHookButton.style.display = "block";
                setupHookDescription.style.display = "block";
                syncMessage.textContent = "Logged in, please setup hook";
                repoName.style.display = "none";
                problemsSolved.style.display = "none";
                difficultyContainer.style.display = "none";
                statuscard.style.display = "none";
                badgesgrid.style.display = "none";
            }
        } else {
            loginButton.style.display = "block";
            loginDescription.style.display = "block";
            logoutButton.style.display = "none";
            setupHookButton.style.display = "none";
            setupHookDescription.style.display = "none";
            syncMessage.textContent = "Not Logged In! Please login first.";
            repoName.style.display = "none";
            problemsSolved.style.display = "none";
            difficultyContainer.style.display = "none";
            statuscard.style.display = "none";
            badgesgrid.style.display = "none";
        }
    };

    const result = await chrome.storage.sync.get(["githubAccessToken", "selectedRepo"]);
    leetSyncUpdateUI(result.githubAccessToken, result.selectedRepo);

    loginButton?.addEventListener("click", () => {
        syncMessage.textContent = "Redirecting to GitHub...";
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo&response_type=code`;

        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, async (redirectUrl) => {
            if (chrome.runtime.lastError) {
                syncMessage.textContent = "Authentication failed";
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
                            leetSyncUpdateUI(data.access_token, null);
                        });
                    }
                } catch (error) {
                    syncMessage.textContent = "Login processing failed";
                }
            }
        });
    });

    setupHookButton?.addEventListener("click", async () => {
        const token = await chrome.storage.sync.get("githubAccessToken");
        if (!token.githubAccessToken) {
            return;
        }
        syncMessage.textContent = "Fetching repositories...";

        const repoGrid = document.getElementById("repoGrid");
        const repoSearch = document.getElementById("repoSearch");
        const confirmRepoBtn = document.getElementById("confirmRepo");
        const createRepoBtn = document.getElementById("createRepoBtn");
        const createRepoForm = document.getElementById("createRepoForm");
        const newRepoName = document.getElementById("newRepoName");
        const repoVisibility = document.getElementById("repoVisibility");
        const submitNewRepo = document.getElementById("submitNewRepo");
        const cancelNewRepo = document.getElementById("cancelNewRepo");
        const searchBar = document.querySelector(".search-bar");
        const repoheader = document.getElementById("repoheader");
        
        let selectedRepo = null;

        const leetSyncFetchRepos = async (page = 1, perPage = 100) => {
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

        const leetSyncRenderRepos = async () => {
            repoGrid.innerHTML = "";
            const repos = await leetSyncFetchRepos();
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
        };

        try {
            await leetSyncRenderRepos();
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
                        leetSyncUpdateUI(token.githubAccessToken, selectedRepo);
                        modal.style.display = "none";
                    });
                }
            });

            createRepoBtn.addEventListener("click", () => {
                createRepoForm.style.display = "block";
                repoGrid.style.display = "none";
                confirmRepoBtn.style.display = "none";
                createRepoBtn.style.display = "none";
                searchBar.style.display = "none";
                repoheader.style.display = "block";
                repoheader.textContent = "Create New Repository";
            });

            cancelNewRepo.addEventListener("click", () => {
                createRepoForm.style.display = "none";
                repoGrid.style.display = "block";
                confirmRepoBtn.style.display = "block";
                createRepoBtn.style.display = "block";
                searchBar.style.display = "block";
                repoheader.textContent = "Select Repository";
                newRepoName.value = "";
            });

            submitNewRepo.addEventListener("click", async () => {
                const repoNameValue = newRepoName.value.trim();
                const isPrivate = repoVisibility.value === "private";

                if (!repoNameValue) {
                    return;
                }

                try {
                    const response = await axios.post(
                        "https://api.github.com/user/repos",
                        {
                            name: repoNameValue,
                            private: isPrivate,
                            auto_init: true
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token.githubAccessToken}`,
                                Accept: "application/vnd.github.v3+json"
                            }
                        }
                    );

                    const newRepoFullName = response.data.full_name;
                    chrome.storage.sync.set({ selectedRepo: newRepoFullName }, () => {
                        leetSyncUpdateUI(token.githubAccessToken, newRepoFullName);
                        modal.style.display = "none";
                    });
                } catch (error) {
                    createRepoForm.style.display = "none";
                    repoGrid.style.display = "block";
                    confirmRepoBtn.style.display = "block";
                    createRepoBtn.style.display = "block";
                    searchBar.style.display = "block";
                    repoheader.textContent = "Select Repository";
                    newRepoName.value = "";
                }
            });
        } catch (error) {
            modal.style.display = "none";
            syncMessage.textContent = "Repository fetch failed";
        }
    });

    logoutButton?.addEventListener("click", () => {
        chrome.storage.sync.remove(["githubAccessToken", "selectedRepo"], () => {
            leetSyncUpdateUI(null, null);
        });
    });
})