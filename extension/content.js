function getSolution() {
    const codeBlock = document.querySelector(".view-lines");
    if (!codeBlock) {
        alert("No code found!");
        return null;
    }

    const code = codeBlock.innerText;
    const title = document.title.split("-")[0].trim().replace(/\s+/g, "_");

    return { title, code };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_solution") {
        sendResponse(getSolution());
    }
});
