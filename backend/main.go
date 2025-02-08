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
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// Load environment variables
func init() {
	err := godotenv.Load()
	if err != nil {
		log.Println("❌ Error loading .env file")
	}
}

// GitHub file structure
type GitHubFile struct {
	Message string `json:"message"`
	Content string `json:"content"`
}

// Push solution to GitHub repo
func pushToGitHub(fileName string, content string) error {
	githubUsername := os.Getenv("GITHUB_USERNAME")
	repoName := os.Getenv("GITHUB_REPO")
	token := os.Getenv("GITHUB_TOKEN")

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", githubUsername, repoName, fileName)

	encodedContent := encodeToBase64(content)

	file := GitHubFile{
		Message: "LeetCode solution added: " + fileName,
		Content: encodedContent,
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
	if resp.StatusCode != 201 {
		return fmt.Errorf("GitHub Error: %s", string(body))
	}

	fmt.Println("✅ Successfully pushed to GitHub:", fileName)
	return nil
}

// ✅ Correct Base64 encoding function
func encodeToBase64(data string) string {
	return base64.StdEncoding.EncodeToString([]byte(data))
}

// API endpoint
func main() {
	r := gin.Default()

	// ✅ Add CORS Middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // You can set specific origins like "chrome-extension://your-extension-id"
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

		err := pushToGitHub(requestBody.Filename, requestBody.Content)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Solution saved to GitHub"})
	})

	fmt.Println("🚀 Server started on port 8080...")
	r.Run(":8080")
}
