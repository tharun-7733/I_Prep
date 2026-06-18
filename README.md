# I_Prep

**I_Prep** is an AI-powered interview preparation platform designed to help candidates practice, receive interactive feedback, and track their progress over time. The platform features a premium dark-themed, glassmorphism UI with a seamless user experience.

## Features

- **Hero Landing Page:** A stunning, dark-themed hero section with animated elements.
- **Authentication:** Robust login and signup flow with session persistence.
- **Practice Arena:** An interactive environment to practice interview questions with AI evaluation.
- **Interactive Feedback & Scoring:** High-end, glassmorphism-themed feedback portal with animated score rings and staggered feedback blocks.
- **Progress Tracking:** Comprehensive dashboard visualizing performance history using interactive line charts and skill radar maps.
- **Leaderboard:** See how you rank against other candidates.
- **User Profile:** Manage your account and view past session reports.

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (No heavy frameworks, highly optimized)
  - *Styling:* Custom CSS with dark-mode glassmorphism aesthetics.
- **Backend:** Python / FastAPI (Handles AI evaluation and API routing)
- **Data Storage:** Local Storage (for session tracking & offline sync), Backend Database integrations.

## Project Structure

```
I_Prep/
├── backend/          # Python backend server (FastAPI, AI evaluation logic)
├── data/             # Static or mocked data files
├── model/            # AI/ML models or scripts for interview evaluation
├── index.html        # Landing page
├── login.html        # Authentication portal
├── practice.html     # Interview practice arena
├── progress.html     # Progress tracking dashboard
├── leaderboard.html  # User rankings
├── profile.html      # User profile management
├── *.css             # Dedicated stylesheets for each page (e.g., styles.css, practice.css)
└── *.js              # Dedicated scripts for interactions and API calls (e.g., auth.js, practice.js)
```

## ⚙️ Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (Optional, for serving the frontend using tools like `live-server`)
- [Python 3.8+](https://www.python.org/) (For running the backend evaluator)

### 1. Clone the repository

```bash
git clone https://github.com/tharun-7733/I_Prep.git
cd I_Prep
```

### 2. Backend Setup

Navigate to the `backend` directory and install the required Python dependencies:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start the Backend Server

Start the FastAPI server (typically runs on port 8000):

```bash
uvicorn evaluator:app --reload
```

*(Note: Verify the entry point file inside the `backend` directory if it differs from `evaluator.py`)*

### 4. Start the Frontend

Serve the static frontend files using any local HTTP server. For example, using Python or Node.js:

**Using Python:**
```bash
# In the root I_Prep directory
python -m http.server 3000
```

**Using Node.js (`serve`):**
```bash
npx serve -p 3000
```

Navigate to `http://51.21.161.230/` in your browser.

## Usage Flow

1. **Sign Up / Login:** Create an account to persist your progress.
2. **Practice:** Navigate to the Practice Arena and answer the AI-generated interview questions.
3. **Get Feedback:** Receive instant, detailed feedback on your answers along with a score.
4. **Track Progress:** View the Progress dashboard to analyze your performance history and skill growth.

## 📄 License

This project is licensed under the MIT License.
