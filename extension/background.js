// ✅ Background script initialized
console.log("🔄 Background Script Load ho rhi h ...");

// Ensure context menu is created when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    console.log(" Creating context menu...");
    chrome.contextMenus.create({
        id: "saveSolution",
        title: "Save LeetCode Solution",
        contexts: ["page"],
    });
});

// ✅ Handle Context Menu Click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || !tab.id) {
        console.error("⚠️ Tab not found for context menu action");
        return;
    }

    if (info.menuItemId === "saveSolution") {
        console.log(" Context Menu Clicked: Save Solution");

        chrome.tabs.sendMessage(tab.id, { action: "save_solution" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(" Error sending message:", chrome.runtime.lastError.message);
            } else {
                console.log(" Message sent successfully:", response);
            }
        });
    }
});

// ✅ Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "log_message") {
        console.log(" Content Script Log:", request.message);
    }

    if (request.action === "get_active_tab") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            sendResponse({ tab: tabs[0] });
        });
        return true; // Important for async response
    }
});
