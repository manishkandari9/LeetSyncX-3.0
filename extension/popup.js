document.addEventListener("DOMContentLoaded", function () {
    let loginButton = document.getElementById("loginGithub");
    let saveButton = document.getElementById("saveSolution");
    let statusText = document.getElementById("status");

    console.log("🔄 DOM Fully Loaded, Initializing Script...");

    const GITHUB_CLIENT_ID = "Ov23lifxi8XMbqm0Zdsa"; // ✅ Replace with your actual client ID
    const REDIRECT_URI = "http://localhost:8080/auth/github/callback"; // ✅ Replace with your backend URL

    // 👉 1️⃣ GitHub Login Process
    if (loginButton) {
        loginButton.addEventListener("click", function () {
            console.log("🔗 Redirecting to GitHub Login...");
            statusText.innerText = "🔄 Redirecting to GitHub...";
            window.open(
                `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`,
                "_blank"
            );
        });
    }

    // 👉 2️⃣ Check if GitHub Token is Saved
    if (chrome.storage && chrome.storage.sync) {
        console.log("🔄 chrome.storage.sync is available.");
        chrome.storage.sync.get(["githubAccessToken"], function (result) {
            if (result.githubAccessToken) {
                console.log("✅ GitHub Token Found! Hiding login button...");
                loginButton.style.display = "none"; 
                statusText.innerText = "✅ Logged in to GitHub";
            } else {
                console.warn("❌ GitHub Token NOT Found! Please log in.");
                statusText.innerText = "❌ Not Logged In! Please login first.";
            }
        });
    } 
    // 👉 3️⃣ Save Solution Button Click
    if (saveButton) {
        saveButton.addEventListener("click", function () {
            console.log("🚀 Save Solution Button Clicked!");
            statusText.innerText = "🔄 Fetching solution from LeetCode...";

            // ✅ Get Active Tab
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (!tabs || tabs.length === 0) {
                    console.error("❌ No Active Tab Found!");
                    alert("❌ Error: No active tab found!");
                    return;
                }

                console.log("📌 Active Tab Found:", tabs[0]);

                // ✅ Send message to content script
                console.log("📩 Sending Message to Content Script...");
                chrome.tabs.sendMessage(tabs[0].id, { action: "save_solution" }, function (response) {
                    if (chrome.runtime.lastError) {
                        console.error("❌ Chrome Runtime Error:", chrome.runtime.lastError.message);
                        alert("❌ Error: Unable to communicate with content script.");
                        return;
                    }

                    if (!response || response.status !== "success") {
                        console.error("❌ Error:", response?.message || "Solution not found!");
                        alert("❌ Error: " + (response?.message || "Solution not found!"));
                        return;
                    }

                    console.log("✅ Solution Extracted Successfully:", response);
                    statusText.innerText = "✅ Solution extracted! Uploading to GitHub...";

                    let problemTitle = response.title ? response.title.replace(/[^a-zA-Z0-9_]/g, "_") : "Unknown_Problem";
                    let problemNumber = response.number ? response.number : "000";
                    let codeContent = response.code?.trim();
                    let language = response.language?.toLowerCase().trim() || "";

                    if (!codeContent) {
                        alert("❌ Error: No code content found!");
                        return;
                    }

                    console.log("📄 Extracted Code:", codeContent);

                    // ✅ Only allow Java & C++
                    if (language === "txt") {
                        let isCpp = /^\s*#include\b/m.test(codeContent) || 
                                    codeContent.includes("std::") || 
                                    /vector\s*<\s*int\s*>/.test(codeContent);

                        let isJava = /public\s+static\s+void\s+main/.test(codeContent) || 
                                     /System\.out\.println/.test(codeContent) || 
                                     /public\s+class\s+\w+\s*{/.test(codeContent);

                        if (isCpp && !isJava) {
                            language = "cpp";
                        } else if (isJava && !isCpp) {
                            language = "java";
                        } else {
                            alert("❌ Error: Only Java & C++ solutions are allowed!");
                            return;
                        }
                    }

                    console.log("📌 Detected Language:", language);

                    const extensionMap = { "cpp": "cpp", "java": "java" };

                    if (!extensionMap[language]) {
                        alert("❌ Error: Only Java & C++ solutions are allowed!");
                        return;
                    }

                    let fileExtension = extensionMap[language];
                    let fileName = `${problemNumber}_${problemTitle}.${fileExtension}`;

                    console.log("📂 File to Save:", fileName);

                    // ✅ Get GitHub Token & Upload Solution
                    chrome.storage.sync.get(["githubAccessToken"], function (result) {
                        if (!result.githubAccessToken) {
                            alert("❌ Error: GitHub Authentication Required! Please log in.");
                            return;
                        }

                        console.log("🔑 GitHub Token Found! Uploading to GitHub...");
                        statusText.innerText = "🔄 Uploading solution to GitHub...";
                        sendToGithub(fileName, codeContent, result.githubAccessToken);
                    });
                });
            });
        });
    }
});

// ✅ Function to send solution to GitHub
function sendToGithub(fileName, code, accessToken) {
    console.log("📤 Sending Code to GitHub:", fileName);

    let githubRepo = "manishkandari09/Leetcode-Solutions"; // ✅ Replace with your repo

    console.log("📦 Target Repository:", githubRepo);

    const githubApiUrl = `https://api.github.com/repos/${githubRepo}/contents/${fileName}`;

    console.log("🌐 Checking if File Already Exists on GitHub...");

    axios.get(githubApiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` } // ✅ FIXED: Use Bearer token
    }).then(response => {
        let sha = response.data.sha;
        console.log("📝 File Found on GitHub. Updating...");

        axios.put(githubApiUrl, {
            message: `Updated ${fileName}`,
            content: btoa(unescape(encodeURIComponent(code))),
            sha
        }, {
            headers: { Authorization: `Bearer ${accessToken}` } // ✅ FIXED: Use Bearer token
        })
        .then(() => {
            console.log("✅ Solution Updated Successfully!");
            alert("✅ Solution Updated on GitHub!");
        })
        .catch(err => {
            console.error("❌ Error Updating File:", err.message);
            alert("❌ Error Updating File: " + err.message);
        });

    }).catch(() => {
        console.log("🆕 File Not Found. Creating New File...");

        axios.put(githubApiUrl, {
            message: `Added ${fileName}`,
            content: btoa(unescape(encodeURIComponent(code)))
        }, {
            headers: { Authorization: `Bearer ${accessToken}` } // ✅ FIXED: Use Bearer token
        })
        .then(() => {
            console.log("✅ Solution Saved Successfully!");
            alert("✅ Solution Saved on GitHub!");
        })
        .catch(err => {
            console.error("❌ Error Saving File:", err.message);
            alert("❌ Error Saving File: " + err.message);
        });
    });
}
