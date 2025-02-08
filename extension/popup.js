document.addEventListener("DOMContentLoaded", function () {
    let saveButton = document.getElementById("saveSolution");

    if (saveButton) {
        console.log("✅ Button Found! Adding Click Event...");

        saveButton.addEventListener("click", function () {
            console.log("🚀 Save button clicked!");

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (!tabs || tabs.length === 0) {
                    console.error("❌ No active tab found!");
                    alert("❌ Error: No active tab found!");
                    return;
                }

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

                    // ✅ Extract problem details
                    let problemTitle = response.title ? response.title.replace(/[^a-zA-Z0-9_]/g, "_") : "Unknown_Problem";
                    let problemNumber = response.number ? response.number : "000";
                    let codeContent = response.code?.trim();

                    if (!codeContent) {
                        alert("❌ Error: No code content found!");
                        return;
                    }

                    // ✅ File extension mapping
                    const extensionMap = {
                        "python": "py",
                        "cpp": "cpp",
                        "java": "java",
                        "c": "c",
                        "javascript": "js",
                        "typescript": "ts",
                        "ruby": "rb",
                        "go": "go",
                        "rust": "rs",
                        "swift": "swift",
                        "kotlin": "kt",
                        "php": "php",
                        "mysql": "sql",
                        "postgresql": "sql",
                        "sql": "sql",
                        "csharp": "cs"
                    };

                    let fileExtension = extensionMap["sql"] || "txt"; 
                    let fileName = `${problemNumber}_${problemTitle}.${fileExtension}`;

                    sendToBackend(fileName, codeContent);
                });
            });
        });

    } else {
        console.error("❌ Button with ID 'saveSolution' not found! Check popup.html.");
    }
});

// ✅ Function to send solution to backend
function sendToBackend(fileName, code) {
    console.log("📤 Sending to backend:", fileName, code);

    fetch("http://localhost:8080/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileName, content: code }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("✅ Solution Saved:", data);
        alert("✅ Solution Saved to GitHub: " + data.message);
    })
    .catch(error => {
        console.error("❌ Error Saving Solution:", error);
        alert("❌ Error Saving Solution. Check console for details.");
    });
}
