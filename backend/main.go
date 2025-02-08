package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

const githubToken = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN" // 🔴 Apna GitHub token yahan paste karein

type RequestData struct {
	Title string `json:"title"`
	Code  string `json:"code"`
	Repo  string `json:"repo"`
}

func pushToGitHub(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var requestData RequestData
	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Error parsing request", http.StatusBadRequest)
		return
	}

	fileName := strings.ReplaceAll(requestData.Title, " ", "_") + ".js"
	encodedContent := base64.StdEncoding.EncodeToString([]byte(requestData.Code))
	githubApiUrl := fmt.Sprintf("https://api.github.com/repos/%s/contents/%s", requestData.Repo, fileName)

	payload := fmt.Sprintf(`{
		"message": "Added solution for %s",
		"content": "%s"
	}`, requestData.Title, encodedContent)

	req, err := http.NewRequest("PUT", githubApiUrl, strings.NewReader(payload))
	if err != nil {
		http.Error(w, "Request creation failed", http.StatusInternalServerError)
		return
	}

	req.Header.Set("Authorization", "token "+githubToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "GitHub API request failed", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func main() {
	http.HandleFunc("/push", pushToGitHub)
	fmt.Println("🚀 Server started on port 8080...")
	http.ListenAndServe(":8080", nil)
}
