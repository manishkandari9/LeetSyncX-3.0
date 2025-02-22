let solutionsArray = [];

function getSolution() {
    const codeEditor = document.querySelector('.view-lines');
    return codeEditor ? codeEditor.innerText.trim() : null;
}

function getProblemDetails() {
    const titleElem = document.querySelector('[data-cy="question-title"]');
    const numberElem = document.querySelector('.mr-2.text-label-1');
    
    const problemTitle = titleElem 
        ? titleElem.innerText.trim().replace(/[^a-zA-Z0-9 ]/g, "_").replace(/\s+/g, "_") 
        : (document.title.split(" - ")[0] || "Unknown_Problem");
    const problemNumber = numberElem 
        ? (numberElem.innerText.match(/\d+/)?.[0] || "000") 
        : "000";
    
    return { problemTitle, problemNumber };
}

function getLanguage(solutionCode) {
    const langElem = document.querySelector('.ant-select-selection-item');
    let language = langElem ? langElem.innerText.trim().toLowerCase() : "";
    
    if (!language || language === "txt") {
        const isCpp = /^\s*#include\b/m.test(solutionCode) || solutionCode.includes("std::") || /vector\s*<\s*int\s*>/.test(solutionCode);
        const isJava = /public\s+static\s+void\s+main/.test(solutionCode) || /System\.out\.println/.test(solutionCode);
        
        if (isCpp && !isJava) return "cpp";
        if (isJava && !isCpp) return "java";
        return null;
    }
    return language === "python3" ? "py" : language;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "save_solution") {
        const solutionCode = getSolution();
        if (!solutionCode) {
            console.error("❌ Solution not found!");
            sendResponse({ status: "error", message: "Solution not found!" });
            return;
        }

        const { problemTitle, problemNumber } = getProblemDetails();
        const language = getLanguage(solutionCode);

        solutionsArray.push({ title: problemTitle, number: problemNumber, code: solutionCode, language });
        console.log("✅ Stored solution in array:", solutionsArray);

        sendResponse({
            status: "success",
            code: solutionCode,
            title: problemTitle,
            number: problemNumber,
            language: language || "txt"
        });
    }
});