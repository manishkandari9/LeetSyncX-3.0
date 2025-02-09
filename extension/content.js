// Global array to store extracted solutions
let solutionsArray = [];

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

// ✅ Function to get problem details (Title, Number)
function getProblemDetails() {
    let titleElem = document.querySelector('[data-cy="question-title"]');
    let numberElem = document.querySelector('.mr-2.text-label-1');
    
    // अगर titleElem नहीं मिलता तो document.title से fallback करें
    let problemTitle = titleElem 
        ? titleElem.innerText.trim().replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_") 
        : (document.title ? document.title.split(" - ")[0] : "Unknown_Problem");
        
    let problemNumber = numberElem 
        ? (numberElem.innerText.match(/\d+/)?.[0] || "000")
        : "000";
    
    console.log("📌 Extracted Problem:", problemNumber, problemTitle);
    return { problemTitle, problemNumber };
}

// ✅ Function to detect the language used in the LeetCode editor
function getLanguage(solutionCode) {
    let langElem = document.querySelector('.ant-select-selection-item');
    let language = langElem ? langElem.innerText.trim().toLowerCase() : "";

    if (!language || language === "txt") {
        let isCpp = /^\s*#include\b/m.test(solutionCode) || 
                    solutionCode.includes("std::") || 
                    /vector\s*<\s*int\s*>/.test(solutionCode);

        let isJava = /public\s+static\s+void\s+main/.test(solutionCode) || 
                     /System\.out\.println/.test(solutionCode) || 
                     /public\s+class\s+\w+\s*{/.test(solutionCode);

        if (isCpp && !isJava) {
            language = "cpp";  // ✅ Only C++ detected
        } else if (isJava && !isCpp) {
            language = "java"; // ✅ Only Java detected
        } else {
            return null;  // ❌ If neither or both are detected, return null
        }
        
        console.log("✅ Heuristic detected language:", language);
    }

    return language;
}



// ✅ Listen for message from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "save_solution") {
        let solutionCode = getSolution();
        let { problemTitle, problemNumber } = getProblemDetails();
        let language = getLanguage(solutionCode);  // अब improved heuristic detection लागू
        
        if (solutionCode) {
            // एक्सट्रैक्टेड solution को array में स्टोर करें
            solutionsArray.push({
                title: problemTitle,
                number: problemNumber,
                code: solutionCode,
                language: language
            });
            console.log("✅ Stored solution in array:", solutionsArray);

            sendResponse({
                status: "success",
                code: solutionCode,
                title: problemTitle,
                number: problemNumber,
                language: language
            });
        } else {
            console.error("❌ Solution not found!");
            sendResponse({ status: "error", message: "Solution not found!" });
        }
    }
});
