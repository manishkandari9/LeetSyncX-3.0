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
    const badgesgrid = document.getElementById("badges-grid");

    // Create difficulty count spans
    const easyCount = document.createElement('span');
    const mediumCount = document.createElement('span');
    const hardCount = document.createElement('span');

    easyCount.id = 'easyCount';
    mediumCount.id = 'mediumCount';
    hardCount.id = 'hardCount';

    // Set initial button text and append spans once
    easyBtn.textContent = "Easy: ";
    mediumBtn.textContent = "Medium: ";
    hardBtn.textContent = "Hard: ";
    easyBtn.appendChild(easyCount);
    mediumBtn.appendChild(mediumCount);
    hardBtn.appendChild(hardCount);

    // Streak ke liye naya element fetch karo
    const streakInfo = document.querySelector(".streak-info");
    // const streakLabel = document.querySelector(".streak-label");
    const streakProgress = document.querySelector(".streak-progress");
    const streakNumber = document.querySelector(".streak-number");

    if (modal) {
        modal.style.display = "none";
    }

    if (streakInfo) {
        streakInfo.style.display = "none"; // Initially hide streak section
    }

    const GITHUB_CLIENT_ID = "Ov23lifxi8XMbqm0Zdsa";
    const REDIRECT_URI = "https://emppmgemkbjiojiblefmidpoichmbggg.chromiumapp.org";
    const BACKEND_URL = "http://localhost:8080";

    // Tumhara original difficulty display function, unchanged
    const updateDifficultyDisplay = (stats) => {
        const easy = stats.Easy || 0;
        const medium = stats.Medium || 0;
        const hard = stats.Hard || 0;
        const total = easy + medium + hard;

        // Only update the spans, not the button text
        easyCount.textContent = easy;
        mediumCount.textContent = medium;
        hardCount.textContent = hard;
        problemsSolved.textContent = `Problems Solved: ${total}`;
    };

    // Naya streak update function alag se
    // Yeh streak ko calculate aur display karega
    const updateStreakDisplay = (streakDates) => {
        if (!streakDates || streakDates.length === 0) {
            if (streakInfo) streakInfo.style.display = "none";
            return 0;
        }

        const sortedDates = [...streakDates].sort(); // Dates ko sort karo
        let streak = 1;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        let currentDate = new Date(sortedDates[sortedDates.length - 1]); // Latest date
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastDateStr = currentDate.toISOString().split('T')[0];

        // Agar last date aaj ya kal nahi hai, streak toot gaya
        if (lastDateStr !== todayStr && lastDateStr !== yesterdayStr) {
            if (streakInfo) streakInfo.style.display = "none";
            return 0;
        }

        // Streak calculate karo
        for (let i = sortedDates.length - 2; i >= 0; i--) {
            const prevDate = new Date(sortedDates[i]);
            const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
            if (diffDays === 1) {
                streak++;
                currentDate = prevDate;
            } else {
                break;
            }
        }

        // Streak UI update karo
        if (streakInfo) {
            streakInfo.style.display = "block";
            streakNumber.textContent = `${streak}`;
            // streakLabel.textContent = `Keep going! You're on a ${streak}-day streak!`;
            streakProgress.style.width = `${Math.min(streak * 10, 100)}%`; // Progress bar 10% per day, max 100%
        }

        return streak;
    };

    const leetSyncUpdateUI = async (token, repo) => {
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

                // Fetch initial difficulty stats aur streak dates se storage
                chrome.storage.local.get(["difficultyStats", "streakDates"], (result) => {
                    const stats = result.difficultyStats || { Easy: 0, Medium: 0, Hard: 0 };
                    const streakDates = result.streakDates || [];
                    updateDifficultyDisplay(stats); // Tumhara original function
                    updateStreakDisplay(streakDates); // Naya streak function
                });
            } else {
                setupHookButton.style.display = "block";
                setupHookDescription.style.display = "block";
                syncMessage.textContent = "Logged in, please setup hook";
                repoName.style.display = "none";
                problemsSolved.style.display = "none";
                difficultyContainer.style.display = "none";
                statuscard.style.display = "none";
                badgesgrid.style.display = "none";
                if (streakInfo) streakInfo.style.display = "none"; // Streak hide karo
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
            if (streakInfo) streakInfo.style.display = "none"; // Streak hide karo
        }
    };

    // Initial UI load
    const result = await chrome.storage.sync.get(["githubAccessToken", "selectedRepo"]);
    leetSyncUpdateUI(result.githubAccessToken, result.selectedRepo);

    // Listen for difficulty stats aur streak updates from content.js
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "updateDifficultyStats") {
            updateDifficultyDisplay(message.difficultyStats); // Tumhara original function
            updateStreakDisplay(message.streakDates); // Naya streak function
        }
    });

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
            // chrome.storage.local.remove(["difficultyStats", "streakDates"], () => { 
                leetSyncUpdateUI(null, null);
            // });
        });
    });
});