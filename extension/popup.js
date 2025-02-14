document.addEventListener("DOMContentLoaded", function () {
    let loginButton = document.getElementById("loginGithub");
    let saveButton = document.getElementById("saveSolution");
    let setupHookButton = document.getElementById("setupHook"); // ✅ Setup Hook Button
    let statusText = document.getElementById("status");

    console.log(" DOM Fully Loaded, Initializing Script...");

    const GITHUB_CLIENT_ID = "Ov23lifxi8XMbqm0Zdsa"; // ✅ Replace with your actual client ID
    const REDIRECT_URI = "http://localhost:8080/auth/github/callback"; // ✅ Replace with your backend URL

    // 👉 1️⃣ GitHub Login Process
    if (loginButton) {
        loginButton.addEventListener("click", function () {
            console.log("🔗 Redirecting to GitHub...");
            statusText.innerText = "Redirecting to GitHub...";
            
            // ✅ Directly redirect to GitHub OAuth login page
            window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`;
        });
        
    }

    // 👉 2️⃣ Check if GitHub Token is Saved Securely
    document.addEventListener('DOMContentLoaded', function() {
        // Ensure 'chrome.storage.sync' is available
        if (chrome && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(["githubAccessToken"], function(result) {
                if (result.githubAccessToken) {
                    console.log("GitHub Token Found! Auto-Logging In...");
                    if (loginButton) loginButton.style.display = "none"; 
                    if (setupHookButton) setupHookButton.style.display = "block"; // ✅ Show Setup Hook
                    statusText.innerText = "Logged in to GitHub";
                } else {
                    console.warn("GitHub Token NOT Found! Please log in.");
                    statusText.innerText = "Not Logged In! Please login first.";
                }
            });
        } else {
            console.error("'chrome.storage.sync' is undefined");
        }
    });
    

    //  3️ Save Solution Button Click
    if (saveButton) {
        saveButton.addEventListener("click", function () {
            console.log(" Save Solution Button Clicked!");
            statusText.innerText = " Fetching solution from LeetCode...";

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (!tabs || tabs.length === 0) {
                    console.error(" No Active Tab Found!");
                    alert(" Error: No active tab found!");
                    return;
                }

                console.log(" Active Tab Found:", tabs[0]);

                chrome.tabs.sendMessage(tabs[0].id, { action: "save_solution" }, function (response) {
                    if (chrome.runtime.lastError) {
                        console.error(" Chrome Runtime Error:", chrome.runtime.lastError.message);
                        alert(" Error: Unable to communicate with content script.");
                        return;
                    }

                    if (!response || response.status !== "success") {
                        console.error(" Error:", response?.message || "Solution not found!");
                        alert(" Error: " + (response?.message || "Solution not found!"));
                        return;
                    }

                    console.log(" Solution Extracted Successfully:", response);
                    statusText.innerText = " Solution extracted! Uploading to GitHub...";

                    let problemTitle = response.title ? response.title.replace(/[^a-zA-Z0-9_]/g, "_") : "Unknown_Problem";
                    let problemNumber = response.number ? response.number : "000";
                    let codeContent = response.code?.trim();
                    let language = response.language?.toLowerCase().trim() || "";

                    if (!codeContent) {
                        alert(" Error: No code content found!");
                        return;
                    }

                    console.log(" Extracted Code:", codeContent);

                    const extensionMap = { "cpp": "cpp", "java": "java", "py": "py", "js": "js" };

                    if (!extensionMap[language]) {
                        alert(" Error: Only Java, C++, Python & JavaScript solutions are allowed!");
                        return;
                    }

                    let fileExtension = extensionMap[language];
                    let fileName = `${problemNumber}_${problemTitle}.${fileExtension}`;

                    console.log(" File to Save:", fileName);

                    //  Securely Retrieve GitHub Token
                    chrome.storage.sync.get(["githubAccessToken"], function (result) {
                        if (!result.githubAccessToken) {
                            alert(" Error: GitHub Authentication Required! Please log in.");
                            return;
                        }

                        console.log(" GitHub Token mil gya h  Uploading to GitHub...");
                        statusText.innerText = " Uploading solution to GitHub...";
                        sendToGithub(fileName, codeContent, result.githubAccessToken);
                    });
                });
            });
        });
    }
});

// ✅ Secure Function to Store Token in Chrome Storage
function storeGithubToken(accessToken) {
    chrome.storage.sync.set({ githubAccessToken: accessToken }, function () {
        if (chrome.runtime.lastError) {
            console.error(" Error storing token:", chrome.runtime.lastError);
        } else {
            console.log(" GitHub Access Token securely stored in Chrome Storage!");
        }
    });
}

//  Function to send solution to GitHub
function sendToGithub(fileName, code, accessToken) {
    console.log(" Sending Code to GitHub:", fileName);
    let githubRepo = "manishkandari09/Leetcode-Solutions"; // ✅ Replace with your repo
    const githubApiUrl = `https://api.github.com/repos/${githubRepo}/contents/${fileName}`;

    console.log(" Checking if File Already Exists on GitHub...");

    axios.get(githubApiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
    }).then(response => {
        let sha = response.data.sha;
        console.log(" File mil gyi h GitHub. Updating...");

        axios.put(githubApiUrl, {
            message: `Updated ${fileName}`,
            content: btoa(unescape(encodeURIComponent(code))),
            sha
        }, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        .then(() => {
            console.log(" Solution Updated Successfully!");
            alert(" Solution Updated on GitHub!");
        })
        .catch(err => {
            console.error(" Error Updating File:", err.message);
            alert(" Error Updating File: " + err.message);
        });

    }).catch(error => {
        if (error.response && error.response.status === 404) {
            console.log(" File Nahi mili. Creating New File...");

            axios.put(githubApiUrl, {
                message: `Added ${fileName}`,
                content: btoa(unescape(encodeURIComponent(code)))
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            .then(() => {
                console.log(" Solution Saved Successfully!");
                alert(" Solution Saved ho gya   GitHub me !");
            })
            .catch(err => {
                console.error(" Error Saving File:", err.message);
                alert(" Error Saving File: " + err.message);
            });

        } else if (error.response && error.response.status === 401) {
            console.warn(" Token Expired! Logging out user...");
            chrome.storage.sync.remove("githubAccessToken", function () {
                alert(" Session Expired ho gya h ! Please log in karo phirr se.");
                location.reload();
            });

        } else {
            console.error(" Unknown Error:", error.message);
            alert(" Error: " + error.message);
        }
    });
}
