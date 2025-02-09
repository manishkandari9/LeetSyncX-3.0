// ✅ Run when popup.html loads
document.addEventListener("DOMContentLoaded", function () {
    let saveButton = document.getElementById("saveSolution");

    if (saveButton) {
        console.log("✅ Button Found! Adding Click Event...");

        saveButton.addEventListener("click", function () {
            console.log("🚀 Save button clicked!");

            // ✅ Get active tab
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (!tabs || tabs.length === 0) {
                    console.error("❌ No active tab found!");
                    alert("❌ Error: No active tab found!");
                    return;
                }

                // ✅ Send message to content script
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

                    console.log("✅ Solution Extracted:", response);

                    // ✅ Extract problem details from the response
                    let problemTitle = response.title ? response.title.replace(/[^a-zA-Z0-9_]/g, "_") : "Unknown_Problem";
                    let problemNumber = response.number ? response.number : "000";
                    let codeContent = response.code?.trim();
                    let language = response.language?.toLowerCase().trim() || ""; // Normalize language input

                    if (!codeContent) {
                        alert("❌ Error: No code content found!");
                        return;
                    }

                    // ✅ Strictly allow only Java & C++ detection
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

                    // ✅ File extension mapping based on detected language
                    const extensionMap = {
                        "cpp": "cpp",

                    };

                    if (!extensionMap[language]) {
                        alert("❌ Error: Only Java & C++ solutions are allowed!");
                        return;
                    }

                    let fileExtension = extensionMap[language];
                    let fileName = `${problemNumber}_${problemTitle}.${fileExtension}`;

                    sendToBackend(fileName, codeContent);
                });
            });
        });

    } else {
        console.error("❌ Button with ID 'saveSolution' not found! Check popup.html.");
    }
});

// ✅ Function to send solution to backend using axios
function sendToBackend(fileName, code) {
    console.log("📤 Sending to backend:", fileName);

    axios.post("http://localhost:8080/save", {
        filename: fileName,
        content: code
    }, {
        headers: { "Content-Type": "application/json" }
    })
    .then(response => {
        console.log("✅ Solution Saved:", response.data);
        alert("✅ Solution Saved to GitHub: " + response.data.message);
    })
    .catch(error => {
        console.error("❌ Error Saving Solution:", error);
        let errorMessage = error.response?.data?.message || error.message || "Unknown error";
        alert("❌ Error Saving Solution: " + errorMessage);
    });
}
