// ✅ Background script initialized
console.log("🔄 Background Script Load ho rhi h ...");

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveSolution",
        title: "Save LeetCode Solution",
        contexts: ["page"],
    });
});

//  2️ Handle Context Menu Click ko
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveSolution") {
        console.log(" Context Menu KO Click kiya  Save Solution");
        chrome.tabs.sendMessage(tab.id, { action: "save_solution" });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "log_message") {
        console.log("  Content Script ka log:", request.message);
    }

    if (request.action === "get_active_tab") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            sendResponse({ tab: tabs[0] });
        });
        return true;
    }
});
