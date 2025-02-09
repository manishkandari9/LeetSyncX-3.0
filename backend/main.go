package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// ✅ Load environment variables
func init() {
	err := godotenv.Load()
	if err != nil {
		log.Println("❌ Error loading .env file")
	}
}

// ✅ GitHub file structure
type GitHubFile struct {
	Message string `json:"message"`
	Content string `json:"content"`
	SHA     string `json:"sha,omitempty"`
}

// ✅ Function to get SHA of existing file (if it exists)
func getFileSHA(fileName string) (string, error) {
	githubUsername := os.Getenv("GITHUB_USERNAME")
	repoName := os.Getenv("GITHUB_REPO")
	token := os.Getenv("GITHUB_TOKEN")

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", githubUsername, repoName, fileName)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "token "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		log.Println("⚠️ File not found. Proceeding with creation.")
		return "", nil
	}

	body, _ := ioutil.ReadAll(resp.Body)

	var fileData struct {
		SHA string `json:"sha"`
	}
	err = json.Unmarshal(body, &fileData)
	if err != nil {
		return "", err
	}

	return fileData.SHA, nil
}

// ✅ Function to check if file content is same as existing GitHub file
func isDuplicate(fileName string, newContent string) (bool, error) {
	githubUsername := os.Getenv("GITHUB_USERNAME")
	repoName := os.Getenv("GITHUB_REPO")
	token := os.Getenv("GITHUB_TOKEN")

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", githubUsername, repoName, fileName)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false, err
	}

	req.Header.Set("Authorization", "token "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return false, nil
	}

	body, _ := ioutil.ReadAll(resp.Body)

	var fileData struct {
		Content string `json:"content"`
	}
	err = json.Unmarshal(body, &fileData)
	if err != nil {
		return false, err
	}

	decodedContent, err := base64.StdEncoding.DecodeString(strings.TrimSpace(fileData.Content))
	if err != nil {
		return false, err
	}

	return string(decodedContent) == newContent, nil
}

// ✅ Function to push/update file to GitHub
func pushToGitHub(fileName string, content string) error {
	githubUsername := os.Getenv("GITHUB_USERNAME")
	repoName := os.Getenv("GITHUB_REPO")
	token := os.Getenv("GITHUB_TOKEN")

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", githubUsername, repoName, fileName)

	encodedContent := encodeToBase64(content)

	sha, err := getFileSHA(fileName)
	if err != nil {
		log.Println("❌ Error getting file SHA:", err)
	}

	isSame, err := isDuplicate(fileName, content)
	if err != nil {
		log.Println("❌ Error checking duplicate:", err)
	}

	if isSame {
		log.Println("✅ File already exists with same content. No update needed.")
		return nil
	}

	file := GitHubFile{
		Message: "LeetCode solution added: " + fileName,
		Content: encodedContent,
		SHA:     sha,
	}

	jsonData, err := json.Marshal(file)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "token "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		return fmt.Errorf("GitHub Error: %s", string(body))
	}

	fmt.Println("✅ Successfully pushed to GitHub:", fileName)
	return nil
}

// ✅ Function to extract LeetCode problem name
func extractLeetCodeProblem(content string) string {
	re := regexp.MustCompile(`(?i)(leetcode.*?\d+)`)
	matches := re.FindStringSubmatch(content)
	if len(matches) > 0 {
		return matches[0]
	}
	return "Unknown_Problem"
}

// ✅ Function to encode content to Base64
func encodeToBase64(data string) string {
	return base64.StdEncoding.EncodeToString([]byte(data))
}

// ✅ API Endpoint for Chrome Extension
func main() {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.POST("/save", func(c *gin.Context) {
		var requestBody struct {
			Filename string `json:"filename"`
			Content  string `json:"content"`
		}

		if err := c.BindJSON(&requestBody); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}

		// ✅ अब फ़ाइल का नाम जैसा है वैसा ही रहेगा (एक्सटेंशन हटेगा नहीं)
		finalFilename := requestBody.Filename

		err := pushToGitHub(finalFilename, requestBody.Content)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Solution saved to GitHub", "filename": finalFilename})
	})

	fmt.Println("🚀 Server started on port 8080...")
	r.Run(":8080")
}
