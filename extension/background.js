// ✅ Background script initialized
console.log("🔄 Background Script Loaded...");

// 👉 1️⃣ Add Right Click Context Menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveSolution",
        title: "Save LeetCode Solution",
        contexts: ["page"],
    });
});

// 👉 2️⃣ Handle Context Menu Click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveSolution") {
        console.log("📌 Context Menu Clicked: Save Solution");
        chrome.tabs.sendMessage(tab.id, { action: "save_solution" });
    }
});

// 👉 3️⃣ Listen for Messages from Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "log_message") {
        console.log("📩 Log from Content Script:", request.message);
    }

    if (request.action === "get_active_tab") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            sendResponse({ tab: tabs[0] });
        });
        return true;
    }
});
