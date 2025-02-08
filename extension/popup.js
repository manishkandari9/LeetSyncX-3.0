document.getElementById("save").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                function: getSolutionFromPage
            },
            (injectionResults) => {
                if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                    const { title, code } = injectionResults[0].result;
                    const repo = document.getElementById("repo").value;

                    fetch("http://localhost:8080/push", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title, code, repo })
                    }).then(response => response.json())
                      .then(data => alert(data.message))
                      .catch(error => alert("Error: " + error));
                }
            }
        );
    });
});

function getSolutionFromPage() {
    return getSolution();
}
