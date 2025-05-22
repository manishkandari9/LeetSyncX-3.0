// content.js
// Language extensions supported by LeetCode
const supportedLanguages = {
  C: ".c",
  "C++": ".cpp",
  "C#": ".cs",
  Bash: ".sh",
  Dart: ".dart",
  Elixir: ".ex",
  Erlang: ".erl",
  Go: ".go",
  Java: ".java",
  JavaScript: ".js",
  Javascript: ".js",
  Kotlin: ".kt",
  MySQL: ".sql",
  "MS SQL Server": ".sql",
  Oracle: ".sql",
  PHP: ".php",
  Pandas: ".py",
  PostgreSQL: ".sql",
  Python: ".py",
  Python3: ".py",
  Racket: ".rkt",
  Ruby: ".rb",
  Rust: ".rs",
  Scala: ".scala",
  Swift: ".swift",
  TypeScript: ".ts",
};

const PROBLEM_TYPE_STANDARD = 0;
const PROBLEM_TYPE_EXPLORE = 1;

class LeetsyncX {
  constructor() {
    this.solutionDetails = null;
    this.spinnerId = "leetsyncx_spinner";
    this.spinnerClass = "leetsyncx_spinner_style";
    this.addLoadingSpinner();
  }

  addLoadingSpinner() {
    const styleTag = document.createElement("style");
    styleTag.textContent = `
      .${this.spinnerClass} {
        width: 1.5em;
        height: 1.5em;
        border: 0.3em solid #ddd;
        border-top: 0.3em solid #ff6c0a;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleTag);
  }

  showSpinner() {
    let spinnerContainer = document.getElementById("leetsyncx_spinner_container");
    if (!spinnerContainer) {
      spinnerContainer = document.createElement("span");
      spinnerContainer.id = "leetsyncx_spinner_container";
      spinnerContainer.style.marginRight = "15px";
      spinnerContainer.style.paddingTop = "3px";
    }
    spinnerContainer.innerHTML = `<div id="${this.spinnerId}" class="${this.spinnerClass}"></div>`;
    const targetArea = document.querySelector(".ml-auto");
    if (targetArea) {
      targetArea.prepend(spinnerContainer);
    }
  }

  showSuccess() {
    const spinner = document.getElementById(this.spinnerId);
    if (spinner) {
      spinner.className = "";
      spinner.style.cssText = `
        display: inline-block;
        transform: rotate(45deg);
        height: 20px;
        width: 10px;
        border-bottom: 5px solid rgb(9, 245, 9);
        border-right: 5px solid #32cd32;
      `;
      setTimeout(() => spinner.remove(), 2000); // Remove spinner after 2 seconds
    }
  }

  showFailure() {
    const spinner = document.getElementById(this.spinnerId);
    if (spinner) {
      spinner.className = "";
      spinner.style.cssText = `
        display: inline-block;
        transform: rotate(45deg);
        height: 20px;
        width: 10px;
        border-bottom: 5px solid rgb(255, 51, 0);
        border-right: 5px solid #ff4500;
      `;
      setTimeout(() => spinner.remove(), 2000); // Remove spinner after 2 seconds
    }
  }

  async fetchSolutionDetails() {
    const problemSlug = document.URL.match(/leetcode\.com\/problems\/([^\/]*)\//)?.[1];
    if (!problemSlug) return false;

    const storedData = await chrome.storage.local.get(problemSlug);
    if (!storedData[problemSlug]) {
      alert("Please submit a solution first!");
      return false;
    }
    const solutionId = storedData[problemSlug];

    const queryPayload = {
      query: `
        query submissionDetails($submissionId: Int!) {
          submissionDetails(submissionId: $submissionId) {
            runtime runtimeDisplay runtimePercentile memory memoryDisplay memoryPercentile
            code lang { verboseName } question { questionId title titleSlug content difficulty }
          }
        }
      `,
      variables: { submissionId: solutionId },
      operationName: "submissionDetails",
    };

    try {
      const response = await fetch("https://leetcode.com/graphql/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queryPayload),
      });
      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0].message);
      this.solutionDetails = data.data.submissionDetails;
      return true;
    } catch (error) {
      console.error("Failed to fetch solution details:", error);
      this.solutionDetails = null;
      return false;
    }
  }

  extractCode() {
    return this.solutionDetails?.code || null;
  }

  detectLanguage() {
    return this.solutionDetails
      ? supportedLanguages[this.solutionDetails.lang.verboseName]
      : null;
  }

  buildFileName() {
    let problemId = this.solutionDetails?.question?.questionId;
    let problemSlug = this.solutionDetails?.question?.titleSlug;

    if (!problemId || !problemSlug) {
      const link = document.querySelector('a[href*="/problems/"]');
      if (link) {
        const linkText = link.textContent;
        const idMatch = linkText.match(/^\d+/);
        problemId = idMatch ? idMatch[0] : "unknown";
        problemSlug = document.URL.match(/problems\/([^\/]*)/)?.[1] || "unknown-problem";
      }
    }

    const maxDigits = 4;
    const parts = `${problemId}-${problemSlug}`.split("-");
    const numLength = parts[0].length;
    if (numLength < maxDigits) {
      parts[0] = "0".repeat(maxDigits - numLength) + parts[0];
    }
    return parts.join("-");
  }

  checkSubmissionSuccess() {
    const resultTags = document.querySelectorAll('[data-e2e-locator="submission-result"]');
    if (resultTags.length > 0) {
      resultTags[0].classList.add("sync_success");
      return true;
    }
    return false;
  }

  getSolutionStats() {
    if (!this.solutionDetails) return "Performance stats unavailable - LeetsyncX";
    const { runtimeDisplay, runtimePercentile, memoryDisplay, memoryPercentile } = this.solutionDetails;
    const runtimeVal = runtimeDisplay || "N/A";
    const runtimePercent = runtimePercentile != null
      ? Math.round((runtimePercentile + Number.EPSILON) * 100) / 100
      : "N/A";
    const memoryVal = memoryDisplay || "N/A";
    const memoryPercent = memoryPercentile != null
      ? Math.round((memoryPercentile + Number.EPSILON) * 100) / 100
      : "N/A";
    return `Runtime: ${runtimeVal} (${runtimePercent}%), Memory: ${memoryVal} (${memoryPercent}%) - LeetsyncX`;
  }

  trackSubmissionNavigation() {
    if (window.navigation) {
      window.navigation.addEventListener("navigate", () => {
        const problemMatch = window.location.href.match(/leetcode\.com\/problems\/(.*)\/submissions/);
        const submissionMatch = window.location.href.match(/\/(\d+)(\/|\?|$)/);
        if (problemMatch?.[1] && submissionMatch?.[1]) {
          chrome.storage.local.set({ [problemMatch[1]]: submissionMatch[1] });
        }
      });
    }
  }
}

async function syncSolution(syncHandler) {
  let attemptCount = 0;
  const maxAttempts = 10;
  syncHandler.showSpinner();

  const syncInterval = setInterval(async () => {
    try {
      if (!syncHandler.checkSubmissionSuccess()) {
        attemptCount++;
        if (attemptCount > maxAttempts) {
          clearInterval(syncInterval);
          syncHandler.showFailure();
        }
        return;
      }

      clearInterval(syncInterval);
      if (!(await syncHandler.fetchSolutionDetails())) {
        syncHandler.showFailure();
        return;
      }

      const stats = syncHandler.getSolutionStats();
      const fileName = syncHandler.buildFileName();
      const langExt = syncHandler.detectLanguage();
      if (!langExt) throw new Error("Language not detected");

      const solutionCode = syncHandler.extractCode();
      if (!solutionCode) throw new Error("Solution code not found");

      const syncPayload = {
        action: "push_solution",
        solution: {
          title: fileName,
          code: solutionCode,
          language: langExt,
        },
      };

      chrome.runtime.sendMessage(syncPayload, (response) => {
        if (response.status === "success") {
          console.log("LeetsyncX synced solution to GitHub:", response.message);
          syncHandler.showSuccess();

          const difficulty = syncHandler.solutionDetails?.question?.difficulty || "Unknown";
          chrome.storage.local.get(["difficultyStats", "streakDates"], (result) => {
            let stats = result.difficultyStats || { Easy: 0, Medium: 0, Hard: 0 };
            stats[difficulty] = (stats[difficulty] || 0) + 1;

            const today = new Date().toISOString().split("T")[0];
            let streakDates = result.streakDates || [];
            if (!streakDates.includes(today)) {
              streakDates.push(today);
              streakDates.sort();
            }

            chrome.storage.local.set({ difficultyStats: stats, streakDates }, () => {
              chrome.runtime.sendMessage({
                action: "updateDifficultyStats",
                difficultyStats: stats,
                streakDates,
              });
            });
          });
        } else {
          console.error("LeetsyncX sync failed:", response.message);
          syncHandler.showFailure();
        }
      });
    } catch (error) {
      console.error("LeetsyncX error:", error);
      syncHandler.showFailure();
      clearInterval(syncInterval);
    }
  }, 1000);
}

// Monitor submit button
const watchSubmit = new MutationObserver(() => {
  const submitBtn = document.querySelector('[data-e2e-locator="console-submit-button"]');
  if (submitBtn) {
    const syncHandler = new LeetsyncX();
    submitBtn.addEventListener("click", () => syncSolution(syncHandler), { once: true });
    watchSubmit.disconnect();
  }
});

setTimeout(() => {
  watchSubmit.observe(document.body, { childList: true, subtree: true });
  const syncHandler = new LeetsyncX();
  syncHandler.trackSubmissionNavigation();
}, 2000);