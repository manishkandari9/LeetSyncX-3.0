// ✅ Function to get solution from LeetCode editor
function getSolution() {
    let codeEditor = document.querySelector('.view-lines');
    if (codeEditor) {
        console.log("✅ Solution Extracted:", codeEditor.innerText);
        return codeEditor.innerText.trim();
    }
    console.log("❌ No solution found in editor!");
    return null;
}

// ✅ Function to get problem details (Title, Number, Language)
function getProblemDetails() {
    let titleElem = document.querySelector('[data-cy="question-title"]');
    let numberElem = document.querySelector('.mr-2.text-label-1');
    
    let problemTitle = titleElem ? titleElem.innerText.trim().replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_") : "Unknown_Problem";
    let problemNumber = numberElem ? numberElem.innerText.match(/\d+/)?.[0] : "000";
    
    console.log("📌 Extracted Problem:", problemNumber, problemTitle);
    
    return { problemTitle, problemNumber };
}

// ✅ Listen for message from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "save_solution") {
        let solutionCode = getSolution();
        let { problemTitle, problemNumber } = getProblemDetails();

        if (solutionCode) {
            sendResponse({
                status: "success",
                code: solutionCode,
                title: problemTitle,
                number: problemNumber
            });
        } else {
            console.error("❌ Solution not found!");
            sendResponse({ status: "error", message: "Solution not found!" });
        }
    }
});