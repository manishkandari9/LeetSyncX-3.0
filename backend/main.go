package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// 🔹 Global Variables
var githubClientID, githubClientSecret, redirectURI, githubUsername, githubRepo string

//  Load environment variables
func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ Warning: Could not load .env file")
	}

	githubClientID = getEnv("GITHUB_CLIENT_ID")
	githubClientSecret = getEnv("GITHUB_CLIENT_SECRET")
	redirectURI = getEnv("GITHUB_REDIRECT_URI")
	githubUsername = getEnv("GITHUB_USERNAME")
	githubRepo = getEnv("GITHUB_REPO")
}

// 🔹 Helper function to get environment variables safely
func getEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf(" Missing environment variable: %s", key)
	}
	return value
}

//  Step 1: Get GitHub OAuth URL
func getGitHubLoginURL() string {
	return fmt.Sprintf("https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=repo", githubClientID, redirectURI)
}

//  Step 2: Exchange GitHub Code for Access Token
func getGitHubAccessToken(code string) (string, error) {
	url := "https://github.com/login/oauth/access_token"

	requestBody, _ := json.Marshal(map[string]string{
		"client_id":     githubClientID,
		"client_secret": githubClientSecret,
		"code":          code,
		"redirect_uri":  redirectURI,
	})

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(requestBody))
	if err != nil {
		return "", fmt.Errorf("request creation failed: %v", err)
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch access token: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var response map[string]string
	if err := json.Unmarshal(body, &response); err != nil {
		return "", fmt.Errorf("failed to parse response: %v", err)
	}

	accessToken, exists := response["access_token"]
	if !exists {
		return "", fmt.Errorf(" No access token found in response: %s", body)
	}

	return accessToken, nil
}

//  Step 3: Check if File Exists & Push to GitHub
func pushToGitHub(accessToken, fileName, content string) error {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", githubUsername, githubRepo, fileName)
	encodedContent := base64.StdEncoding.EncodeToString([]byte(content))

	// 🔹 Check if file already exists
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to check file existence: %v", err)
	}
	defer resp.Body.Close()

	var sha string
	if resp.StatusCode == 200 {
		var fileData map[string]interface{}
		body, _ := io.ReadAll(resp.Body)
		json.Unmarshal(body, &fileData)
		sha, _ = fileData["sha"].(string)
	}

	//  Prepare request to create/update file
	fileData := map[string]string{
		"message": " Auto-update: " + fileName,
		"content": encodedContent,
	}

	if sha != "" {
		fileData["sha"] = sha
	}

	jsonData, _ := json.Marshal(fileData)

	req, err = http.NewRequest("PUT", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("Content-Type", "application/json")

	resp, err = client.Do(req)
	if err != nil {
		return fmt.Errorf("GitHub API request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf(" GitHub API error: %s", string(body))
	}

	log.Println(" Successfully pushed to GitHub:", fileName)
	return nil
}

//  Step 4: API Endpoints
func main() {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	//  Step 1: Redirect to GitHub Login
	r.GET("/login", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"url": getGitHubLoginURL()})
	})

	//  Step 2: Handle GitHub OAuth Callback
	r.GET("/auth/github/callback", func(c *gin.Context) {
		code := c.Query("code")
		if code == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": " Missing authorization code"})
			return
		}
	
		accessToken, err := getGitHubAccessToken(code)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	
		c.SetCookie("githubAccessToken", accessToken, 3600, "/", "localhost", false, true)
	
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Authentication successful!"})
	})
	

	//  Step 3: Save file to GitHub
	r.POST("/save", func(c *gin.Context) {
		var requestBody struct {
			AccessToken string `json:"access_token"`
			Filename    string `json:"filename"`
			Content     string `json:"content"`
		}

		if err := c.BindJSON(&requestBody); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "❌ Invalid request"})
			return
		}

		err := pushToGitHub(requestBody.AccessToken, requestBody.Filename, requestBody.Content)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": " Solution saved to GitHub", "filename": requestBody.Filename})
	})

	fmt.Println("🚀 OAuth Server started on port 8080...")
	r.Run(":8080")
}
