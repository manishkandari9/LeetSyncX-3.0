chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "github_login") {
        console.log("🔗 GitHub OAuth start ho raha hai...");

        const CLIENT_ID = "Ov23lifxi8XMbqm0Zdsa";  // ⚠️ Apna Client ID yahan rakhna
        const REDIRECT_URI = chrome.identity.getRedirectURL(); // ✅ Yeh correct redirect URI ensure karega
        const AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`;

        console.log("🌐 GitHub OAuth URL:", AUTH_URL);

        chrome.identity.launchWebAuthFlow({ url: AUTH_URL, interactive: true }, async (redirectUrl) => {
            if (chrome.runtime.lastError || !redirectUrl) {
                console.error("❌ OAuth Flow mein koi error aayi:", chrome.runtime.lastError?.message);
                sendResponse({ status: "error", message: chrome.runtime.lastError?.message || "OAuth Flow Failed" });
                return;
            }

            const urlParams = new URLSearchParams(new URL(redirectUrl).search);
            const code = urlParams.get("code");

            if (!code) {
                console.error("❌ Authorization Code nahi mila!");
                sendResponse({ status: "error", message: "Authorization code nahi mila" });
                return;
            }

            console.log("✅ Authorization Code Mila:", code);

            try {
                // 🔄 Code ko Access Token mein convert karna
                let response = await fetch(`http://localhost:8080/auth/github/callback`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                let data = await response.json();

                if (data.access_token) {
                    console.log("✅ Access Token Mila:", data.access_token);

                    // Access Token ko cookies mein save karna
                    chrome.cookies.set({
                        url: "https://github.com", // Cookie kis URL par valid hoga
                        name: "github_access_token",  // Cookie ka naam
                        value: data.access_token,  // Token ka value
                        expirationDate: (new Date().getTime() / 1000) + (60 * 60 * 24),  // Expiration time (1 din)
                        secure: true,  // HTTPS par hi bhejna hoga
                        httpOnly: true  // JavaScript se accessible nahi hoga
                    }, () => {
                        if (chrome.runtime.lastError) {
                            console.error("❌ Cookie Save mein error:", chrome.runtime.lastError.message);
                            sendResponse({ status: "error", message: chrome.runtime.lastError.message });
                            return;
                        }

                        console.log("✅ GitHub Access Token Cookies mein save ho gaya!");

                        // GitHub par redirect karna
                        chrome.tabs.create({ url: "https://github.com/settings/tokens" }, () => {
                            // Successfully redirected to GitHub to create repository.
                            console.log("Redirected to GitHub for LeetHub setup");
                        });

                        sendResponse({ status: "success", token: data.access_token });
                    });
                } else {
                    console.error("❌ Access Token fetch karne mein error:", data);
                    sendResponse({ status: "error", message: data.error_description || "Access token retrieve nahi kar paaye" });
                }
            } catch (err) {
                console.error("❌ Fetch mein error:", err.message);
                sendResponse({ status: "error", message: err.message });
            }
        });

        return true; // Async response ke liye message channel open rakhein
    }
});
