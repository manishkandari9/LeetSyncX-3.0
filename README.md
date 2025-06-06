<div align="center">

<h1 style="font-size: 58px;">LeetSyncX-3.0</h1>

<p style="font-size: 20px;">Effortlessly sync your coding journey to GitHub.</p>

![last_commit](https://img.shields.io/badge/last_commit-may-blue) ![javascript](https://img.shields.io/badge/javascript-40.6%25-yellow) ![languages](https://img.shields.io/badge/languages-3-blue)

**Built with the tools and technologies:**

![JSON](https://img.shields.io/badge/JSON-black) ![Markdown](https://img.shields.io/badge/Markdown-black) ![JavaScript](https://img.shields.io/badge/JavaScript-yellow)

</div>

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Support the Project](#support-the-project)
- [Contributing](#contributing)
- [License](#license)

## Overview

LeetSyncX-3.0 is your ultimate companion for effortlessly syncing LeetCode solutions to GitHub, streamlining your coding journey. This Chrome extension automates the process of saving your LeetCode solutions to a GitHub repository, helping you track progress and showcase your work.

### Why LeetSyncX-3.0?

This project serves as a bridge for developers, automating the transfer of coding solutions and enhancing productivity. The core features include:

- 🚀 **Seamless Integration:** Effortlessly sync your LeetCode solutions to GitHub repositories.
- 🎯 **User-Friendly Interface:** Manage repositories and track your progress with ease.
- 🏆 **Streak Tracking:** Stay motivated with achievement badges and progress milestones.
- 💻 **Multi-Language Support:** Handle diverse coding challenges with automatic filename generation.
- 🔔 **Background Processing:** Enjoy efficient syncing and real-time notifications without interrupting your workflow.

## Features

- **Automatic Syncing:** Push LeetCode solutions to GitHub with a single click after submission.
- **Progress Tracking:** Monitor your coding streak and difficulty-wise problem stats (Easy, Medium, Hard).
- **Repository Management:** Select or create a GitHub repository directly from the extension's popup.
- **Real-Time Feedback:** Visual spinners and success/failure indicators for sync operations.
- **Multi-Language Support:** Supports a wide range of programming languages used on LeetCode.

## Screenshots

Below are some screenshots showcasing LeetSyncX-3.0 in action:

| **Popup Interface** | **Sync Success** | **Repository Selection** |
|--------------------|------------------|--------------------------|
| ![Popup Interface](screenshots/popup_interface.png) | ![Sync Success](screenshots/sync_success.png) | ![Repo Selection](screenshots/repo_selection.png) |

*Note: Replace placeholder image paths with actual screenshot files after capturing them.*

## Getting Started

### Prerequisites

- **Google Chrome Browser**: Version 88 or higher.
- **GitHub Account**: Required for authentication and repository access.
- **LeetCode Account**: To access and sync your solutions.
- **GitHub Personal Access Token**: With `repo` scope for API access (generated during setup).

### Installation

To manually load LeetSyncX-3.0 as an unpacked Chrome extension:

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/manishkandari9/leetsyncx-3.0.git
   Or download the ZIP file and extract it.

Open Chrome Extensions Page:
Open Chrome and navigate to chrome://extensions/.
Enable Developer mode (toggle in the top-right corner).
Load the Extension:
Click Load unpacked and select the folder containing the LeetSyncX-3.0 files (e.g., leetsyncx-3.0).
The extension should now appear in your Chrome extensions list.
Pin the Extension:
Click the Extensions icon in Chrome and pin LeetSyncX-3.0 for easy access.
Usage
Authenticate with GitHub:
Click the LeetSyncX-3.0 icon in the Chrome toolbar to open the popup.
Click Login with GitHub and follow the OAuth flow to authenticate.
This will store a GitHub access token in Chrome's storage.
Select or Create a Repository:
After logging in, click Setup Hook to choose an existing GitHub repository or create a new one.
Select a repository from the list or create a new one by providing a name and visibility (public/private).
Sync LeetCode Solutions:
Navigate to a LeetCode problem page (e.g., leetcode.com/problems/two-sum).
Solve and submit your solution.
LeetSyncX-3.0 automatically detects the submission and syncs the solution to your selected GitHub repository.
A spinner appears during syncing, followed by a green checkmark for success or a red cross for failure.
Track Progress:
Open the extension popup to view your problem-solving stats (Easy, Medium, Hard) and streak progress.
Testing
To test LeetSyncX-3.0:

Unit Testing:
Use a testing framework like Jest to test individual components (e.g., LeetsyncX class methods).
Example: Test buildFileName() to ensure correct filename formatting.
Manual Testing:
Load the extension in Chrome.
Solve a LeetCode problem and verify that the solution is pushed to the correct GitHub repository.
Check the popup for updated stats and streak information.
Edge Cases:
Test with unsupported languages or failed submissions.
Verify behavior when GitHub API rate limits are hit.
Note: Automated tests are not yet included but can be added using Jest or Mocha.

Support the Project
Love LeetSyncX-3.0? Help keep it running and support future development by buying me a coffee! Your contributions will help cover deployment costs and add new features.


Note: Replace your-username with your actual Buy Me a Coffee username after setting up an account.

Contributing
Contributions are welcome! To contribute:

Fork the repository.
Create a new branch (git checkout -b feature/your-feature).
Make your changes and commit (git commit -m "Add your feature").
Push to your branch (git push origin feature/your-feature).
Open a Pull Request.
Please ensure your code follows the existing style and includes tests where applicable.
