// popup.js
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
  const easyCount = document.createElement("span");
  const mediumCount = document.createElement("span");
  const hardCount = document.createElement("span");

  easyCount.id = "easyCount";
  mediumCount.id = "mediumCount";
  hardCount.id = "hardCount";

  // Set initial button text and append spans once
  easyBtn.textContent = "Easy: ";
  mediumBtn.textContent = "Medium: ";
  hardBtn.textContent = "Hard: ";
  easyBtn.appendChild(easyCount);
  mediumBtn.appendChild(mediumCount);
  hardBtn.appendChild(hardCount);

  // Streak elements
  const streakInfo = document.querySelector(".streak-info");
  const streakProgress = document.querySelector(".streak-progress");
  const streakNumber = document.querySelector(".streak-number");

  if (modal) {
    modal.style.display = "none";
  }

  if (streakInfo) {
    streakInfo.style.display = "none"; // Initially hide streak section
  }

  const GITHUB_CLIENT_ID = "Ov23lifxi8XMbqm0Zdsa";
  const GITHUB_CLIENT_SECRET = "9b0ea407e63133547e6b26faae48db50b2c8ff2b"; // Note: Store securely
  const REDIRECT_URI =
    "https://emppmgemkbjiojiblefmidpoichmbggg.chromiumapp.org";

  // Update difficulty display
  const updateDifficultyDisplay = (stats) => {
    const easy = stats.Easy || 0;
    const medium = stats.Medium || 0;
    const hard = stats.Hard || 0;
    const total = easy + medium + hard;

    easyCount.textContent = easy;
    mediumCount.textContent = medium;
    hardCount.textContent = hard;
    problemsSolved.textContent = `Problems Solved: ${total}`;
  };

  // Update streak display
  const updateStreakDisplay = (streakDates) => {
    if (!streakDates || streakDates.length === 0) {
      if (streakInfo) {
        streakInfo.style.display = "block";
        streakNumber.textContent = "0";
        streakProgress.style.width = "0%";
      }
      return 0;
    }

    const sortedDates = [...streakDates].sort();
    let streak = 1;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let currentDate = new Date(sortedDates[sortedDates.length - 1]);
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const lastDateStr = currentDate.toISOString().split("T")[0];

    if (lastDateStr !== todayStr && lastDateStr !== yesterdayStr) {
      if (streakInfo) streakInfo.style.display = "";
      return 0;
    }

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

    if (streakInfo) {
      streakInfo.style.display = "block";
      streakNumber.textContent = `${streak}`;
      streakProgress.style.width = `${Math.min(streak * 10, 100)}%`;
    }

    return streak;
  };

  const leetsyncXUpdateUI = async (token, repo) => {
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

        chrome.storage.local.get(["difficultyStats", "streakDates"], (result) => {
          const stats = result.difficultyStats || { Easy: 0, Medium: 0, Hard: 0 };
          const streakDates = result.streakDates || [];
          updateDifficultyDisplay(stats);
          updateStreakDisplay(streakDates);
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
        if (streakInfo) streakInfo.style.display = "none";
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
      if (streakInfo) streakInfo.style.display = "none";
    }
  };

  // Initial UI load
  const result = await chrome.storage.sync.get([
    "githubAccessToken",
    "selectedRepo",
  ]);
  leetsyncXUpdateUI(result.githubAccessToken, result.selectedRepo);

  // Listen for difficulty stats and streak updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateDifficultyStats") {
      updateDifficultyDisplay(message.difficultyStats);
      updateStreakDisplay(message.streakDates);
    }
  });

  // GitHub Login
  loginButton?.addEventListener("click", () => {
    syncMessage.textContent = "Redirecting to GitHub...";
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=repo&response_type=code`;

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      async (redirectUrl) => {
        if (chrome.runtime.lastError) {
          syncMessage.textContent = "Authentication failed";
          return;
        }
        const url = new URL(redirectUrl);
        const code = url.searchParams.get("code");
        if (code) {
          try {
            // Exchange code for access token
            const response = await fetch(
              "https://github.com/login/oauth/access_token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  client_id: GITHUB_CLIENT_ID,
                  client_secret: GITHUB_CLIENT_SECRET,
                  code: code,
                  redirect_uri: REDIRECT_URI,
                }),
              }
            );
            const data = await response.json();
            if (data.access_token) {
              chrome.storage.sync.set(
                { githubAccessToken: data.access_token },
                () => {
                  leetsyncXUpdateUI(data.access_token, null);
                  syncMessage.textContent = "Logged in successfully";
                }
              );
            } else {
              syncMessage.textContent = "Failed to obtain access token";
            }
          } catch (error) {
            syncMessage.textContent = "Login processing failed";
            console.error("Login error:", error);
          }
        } else {
          syncMessage.textContent = "No authorization code received";
        }
      }
    );
  });

  // Setup Repository Hook
  setupHookButton?.addEventListener("click", async () => {
    const token = await chrome.storage.sync.get("githubAccessToken");
    if (!token.githubAccessToken) {
      syncMessage.textContent = "Please login first";
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

    const leetsyncXFetchRepos = async (page = 1, perPage = 100) => {
      const response = await fetch("https://api.github.com/user/repos", {
        headers: {
          Authorization: `Bearer ${token.githubAccessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        params: {
          per_page: perPage,
          page: page,
          sort: "updated",
          direction: "desc",
        },
      });
      return await response.json();
    };

    const leetsyncXRenderRepos = async () => {
      repoGrid.innerHTML = "";
      const repos = await leetsyncXFetchRepos();
      repos.forEach((repo) => {
        const repoCard = document.createElement("div");
        repoCard.className = "repo-card";
        repoCard.innerHTML = `
                    <h3>${repo.name}</h3>
                    <p>${repo.description || "No description"}</p>
                    <p>${
                      repo.private ? "Private" : "Public"
                    } • ${repo.size} KB • Updated: ${new Date(
          repo.updated_at
        ).toLocaleDateString()}</p>
                `;
        repoCard.addEventListener("click", () => {
          document
            .querySelectorAll(".repo-card")
            .forEach((card) => card.classList.remove("selected"));
          repoCard.classList.add("selected");
          selectedRepo = repo.full_name;
          confirmRepoBtn.disabled = false;
        });
        repoGrid.appendChild(repoCard);
      });
    };

    try {
      await leetsyncXRenderRepos();
      modal.style.display = "flex";
      syncMessage.textContent = "Please select a repository.";

      repoSearch.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll(".repo-card").forEach((card) => {
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
            leetsyncXUpdateUI(token.githubAccessToken, selectedRepo);
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
          syncMessage.textContent = "Please enter a repository name";
          return;
        }

        try {
          const response = await fetch("https://api.github.com/user/repos", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token.githubAccessToken}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: repoNameValue,
              private: isPrivate,
              auto_init: true,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create repository");
          }

          const newRepo = await response.json();
          const newRepoFullName = newRepo.full_name;
          chrome.storage.sync.set({ selectedRepo: newRepoFullName }, () => {
            leetsyncXUpdateUI(token.githubAccessToken, newRepoFullName);
            modal.style.display = "none";
            syncMessage.textContent = "Repository created and selected";
          });
        } catch (error) {
          syncMessage.textContent = "Repository creation failed";
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
      console.error("Fetch repos error:", error);
    }
  });

  logoutButton?.addEventListener("click", () => {
    chrome.storage.sync.remove(["githubAccessToken", "selectedRepo"], () => {
      leetsyncXUpdateUI(null, null);
      syncMessage.textContent = "Logged out successfully";
    });
  });
});