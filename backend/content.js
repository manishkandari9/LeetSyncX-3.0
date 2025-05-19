// // Language extensions supported by LeetCode
// const supportedLanguages = {
//     C: '.c',
//     'C++': '.cpp',
//     'C#': '.cs',
//     Bash: '.sh',
//     Dart: '.dart',
//     Elixir: '.ex',
//     Erlang: '.erl',
//     Go: '.go',
//     Java: '.java',
//     JavaScript: '.js',
//     Javascript: '.js',
//     Kotlin: '.kt',
//     MySQL: '.sql',
//     'MS SQL Server': '.sql',
//     Oracle: '.sql',
//     PHP: '.php',
//     Pandas: '.py',
//     PostgreSQL: '.sql',
//     Python: '.py',
//     Python3: '.py',
//     Racket: '.rkt',
//     Ruby: '.rb',
//     Rust: '.rs',
//     Scala: '.scala',
//     Swift: '.swift',
//     TypeScript: '.ts',
// };

// const PROBLEM_TYPE_STANDARD = 0;
// const PROBLEM_TYPE_EXPLORE = 1;
// let currentDifficulty = '';
// let isSyncing = false;

// function hasElements(element) {
//     return element && element.length > 0;
// }

// function toSlug(text) {
//     const specialChars = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
//     const normalChars = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
//     const regex = new RegExp(specialChars.split('').join('|'), 'g');
//     return text
//         .toString()
//         .toLowerCase()
//         .replace(/\s+/g, '-')
//         .replace(regex, char => normalChars.charAt(specialChars.indexOf(char))) 
//         .replace(/&/g, '-and-') 
//         .replace(/[^\w\-]+/g, '') 
//         .replace(/\-\-+/g, '-') 
//         .replace(/^-+|-+$/g, ''); 
// }

// function padNumber(slug) {
//     const maxDigits = 4;
//     const parts = slug.split('-');
//     const numLength = parts[0].length;
//     if (numLength < maxDigits) {
//         parts[0] = '0'.repeat(maxDigits - numLength) + parts[0];
//     }
//     return parts.join('-');
// }

// function getPerformanceStats(runtime, runtimeRank, memory, memoryRank) {
//     return `Runtime: ${runtime} (${runtimeRank}%), Memory: ${memory} (${memoryRank}%) - LeetsyncX`;
// }

// function LeetsyncX() {
//     this.solutionDetails = null;
//     this.spinnerId = 'leetsyncx_spinner';
//     this.spinnerClass = 'leetsyncx_spinner_style';
//     this.addLoadingSpinner();
// }

// LeetsyncX.prototype.fetchSolutionDetails = async function () {
//     const problemSlug = document.URL.match(/leetcode.com\/problems\/([^\/]*)\//)?.[1];
//     const storedData = await chrome.storage.local.get(problemSlug);
//     if (!storedData[problemSlug]) {
//         alert("Submit a solution first!");
//         return false;
//     }
//     const solutionId = storedData[problemSlug];

//     const queryPayload = {
//         query: `
//             query submissionDetails($submissionId: Int!) {
//                 submissionDetails(submissionId: $submissionId) {
//                     runtime runtimeDisplay runtimePercentile memory memoryDisplay memoryPercentile
//                     code lang { verboseName } question { questionId title titleSlug content difficulty }
//                 }
//             }
//         `,
//         variables: { submissionId: solutionId },
//         operationName: 'submissionDetails',
//     };

//     try {
//         const response = await axios({
//             method: 'POST',
//             url: 'https://leetcode.com/graphql/',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             data: queryPayload
//         });

//         this.solutionDetails = response.data.data.submissionDetails;
//     } catch (error) {
//         this.solutionDetails = null;
//         return false;
//     }
// };

// LeetsyncX.prototype.extractCode = function () {
//     return this.solutionDetails ? this.solutionDetails.code : null;
// };

// LeetsyncX.prototype.detectLanguage = function () {
//     return this.solutionDetails ? supportedLanguages[this.solutionDetails.lang.verboseName] : null;
// };

// LeetsyncX.prototype.buildFileName = function () {
//     let problemId = this.solutionDetails?.question?.questionId;
//     let problemSlug = this.solutionDetails?.question?.titleSlug;

//     if (!problemId || !problemSlug) {
//         const link = document.querySelector('a[href*="/problems/"]');
//         if (link) {
//             const linkText = link.textContent;
//             const idMatch = linkText.match(/^\d+/);
//             problemId = idMatch ? idMatch[0] : 'unknown';
//             problemSlug = window.location.pathname.match(/problems\/([^\/]*)/)?.[1] || 'unknown-problem';
//         }
//     }

//     const fileName = padNumber(`${problemId}-${problemSlug}`);
//     return fileName;
// };

// LeetsyncX.prototype.checkSubmissionSuccess = function () {
//     const resultTags = document.querySelectorAll('[data-e2e-locator="submission-result"]');
//     if (hasElements(resultTags)) {
//         resultTags[0].classList.add('sync_success');
//         return true;
//     }
//     return false;
// };

// LeetsyncX.prototype.getSolutionStats = function () {
//     if (this.solutionDetails) {
//         const runtimeVal = this.solutionDetails.runtimeDisplay || "N/A";
//         const runtimePercent = this.solutionDetails.runtimePercentile != null 
//             ? Math.round((this.solutionDetails.runtimePercentile + Number.EPSILON) * 100) / 100 
//             : "N/A";
//         const memoryVal = this.solutionDetails.memoryDisplay || "N/A";
//         const memoryPercent = this.solutionDetails.memoryPercentile != null 
//             ? Math.round((this.solutionDetails.memoryPercentile + Number.EPSILON) * 100) / 100 
//             : "N/A";
//         return getPerformanceStats(runtimeVal, runtimePercent, memoryVal, memoryPercent);
//     }
//     return "Performance stats unavailable - LeetsyncX";
// };

// LeetsyncX.prototype.addLoadingSpinner = function () {
//     const styleTag = document.createElement('style');
//     styleTag.textContent = `.${this.spinnerClass} { width: 1.5em; height: 1.5em; border: 0.3em solid #ddd; border-top: 0.3em solid #ff6c0a; border-radius: 50%; animation: spin 0.8s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`;
//     document.head.appendChild(styleTag);
// };

// LeetsyncX.prototype.showSpinner = function () {
//     let spinnerContainer = document.getElementById('leetsyncx_spinner_container');
//     if (!spinnerContainer) {
//         spinnerContainer = document.createElement('span');
//         spinnerContainer.id = 'leetsyncx_spinner_container';
//         spinnerContainer.style = 'margin-right: 15px; padding-top: 3px;';
//     }
//     spinnerContainer.innerHTML = `<div id="${this.spinnerId}" class="${this.spinnerClass}"></div>`;
//     this.placeSpinner(spinnerContainer);
//     isSyncing = true;
// };

// LeetsyncX.prototype.placeSpinner = function (container) {
//     const targetArea = document.getElementsByClassName('ml-auto')[0];
//     if (targetArea && targetArea.childNodes.length > 0) {
//         targetArea.prepend(container);
//     }
// };

// LeetsyncX.prototype.showSuccess = function () {
//     const spinner = document.getElementById(this.spinnerId);
//     if (spinner) {
//         spinner.className = '';
//         spinner.style = 'display: inline-block; transform: rotate(45deg); height: 20px; width: 10px; border-bottom: 5px solid rgb(9, 245, 9); border-right: 5px solid #32cd32;';
//     }
// };

// LeetsyncX.prototype.showFailure = function () {
//     const spinner = document.getElementById(this.spinnerId);
//     if (spinner) {
//         spinner.className = '';
//         spinner.style = 'display: inline-block; transform: rotate(45deg); height: 20px; width: 10px; border-bottom: 5px solid rgb(255, 51, 0); border-right: 5px solid #ff4500;';
//     }
// };

// LeetsyncX.prototype.trackSubmissionNavigation = function () {
//     window.navigation.addEventListener('navigate', event => {
//         const problemMatch = window.location.href.match(/leetcode.com\/problems\/(.*)\/submissions/);
//         const submissionMatch = window.location.href.match(/\/(\d+)(\/|\?|$)/);
//         if (problemMatch?.length > 1 && submissionMatch?.length > 1) {
//             chrome.storage.local.set({ [problemMatch[1]]: submissionMatch[1] });
//         }
//     });
// };

// const syncSolution = (syncHandler, suffix) => {
//     let attemptCount = 0;
//     syncHandler.showSpinner();
//     const syncInterval = setInterval(async () => {
//         try {
//             const isSubmitted = syncHandler.checkSubmissionSuccess();
//             if (!isSubmitted) {
//                 attemptCount++;
//                 if (attemptCount > 9) {
//                     clearInterval(syncInterval);
//                     syncHandler.showFailure();
//                 }
//                 return;
//             }

//             clearInterval(syncInterval);
//             await syncHandler.fetchSolutionDetails();

//             const stats = syncHandler.getSolutionStats();
//             const fileName = syncHandler.buildFileName();
//             const langExt = syncHandler.detectLanguage();
//             if (!langExt) throw new Error('Language not detected');

//             const solutionCode = syncHandler.extractCode();
//             if (!solutionCode) throw new Error('Solution code not found');

//             const syncPayload = {
//                 action: "push_solution",
//                 solution: {
//                     title: fileName,
//                     code: solutionCode,
//                     language: langExt
//                 }
//             };

//             chrome.runtime.sendMessage(syncPayload, (response) => {
//                 if (response.status === "success") {
//                     console.log("LeetsyncX synced solution to GitHub:", response.message);
//                     isSyncing = false;
//                     syncHandler.showSuccess();

//                     // Update difficulty stats
//                     const difficulty = syncHandler.solutionDetails?.question?.difficulty || "Unknown";
//                     chrome.storage.local.get("difficultyStats", (result) => {
//                         let stats = result.difficultyStats || { Easy: 0, Medium: 0, Hard: 0 };
//                         stats[difficulty] = (stats[difficulty] || 0) + 1;

//                         // Streak ke liye dates update karo
//                         const today = new Date().toISOString().split('T')[0]; // Aaj ka date "YYYY-MM-DD" format mein
//                         chrome.storage.local.get("streakDates", (streakResult) => {
//                             let streakDates = streakResult.streakDates || [];
//                             if (!streakDates.includes(today)) { // Agar aaj ka date nahi hai toh add karo
//                                 streakDates.push(today);
//                                 streakDates.sort(); // Dates ko order mein rakho
//                             }

//                            // Storage mein save karo aur popup.js ko bhejo
//                            chrome.storage.local.set({difficultyStats: stats, streakDates: streakDates }, () => {
//                                 chrome.runtime.sendMessage({
//                                     action: "updateDifficultyStats",
//                                     difficultyStats: stats,
//                                     streakDates: streakDates // Streak ke dates bhi bhej do
//                                 });
//                             });
//                         });
//                     });
//                 } else {
//                     console.error("LeetsyncX sync failed:", response.message);
//                     isSyncing = false;
//                     syncHandler.showFailure();
//                 }
//             });

//         } catch (error) {
//             isSyncing = false;
//             syncHandler.showFailure();
//             clearInterval(syncInterval);
//             console.error("LeetsyncX error:", error);
//         }
//     }, 1000);
// };

// // Monitor submit button
// const watchSubmit = new MutationObserver((_, observerInstance) => {
//     const submitBtn = document.querySelector('[data-e2e-locator="console-submit-button"]');
//     const textAreas = document.getElementsByTagName('textarea');
//     const activeTextArea = textAreas.length === 4 ? textAreas[2] : (textAreas.length === 2 ? textAreas[0] : textAreas[1]);

//     if (submitBtn && activeTextArea) {
//         observerInstance.disconnect();
//         const syncHandler = new LeetsyncX();
//         submitBtn.addEventListener('click', () => syncSolution(syncHandler));
//     }
// });

// setTimeout(() => {
//     watchSubmit.observe(document.body, { childList: true, subtree: true });
// }, 2000);

// setTimeout(() => {
//     const syncHandler = new LeetsyncX();
//     syncHandler.trackSubmissionNavigation();
// }, 6000);
