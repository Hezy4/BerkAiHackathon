# 🛍️ AI-Powered Shopping Assistant

## 🧠 Overview

This project is an AI-powered shopping assistant that helps users find the best local options for their shopping needs through a natural and conversational interface.

Users can make requests like:
- “I need to build a budget gaming PC”
- “What do I need for pancakes?”

In response, the assistant provides intelligent, real-world product recommendations based on price, quality, or a balanced approach.

---

## 🏗️ Architecture

The application is divided into two main components:

- **Backend**: A Python Flask API powered by the **Google Gemini API**
- **Frontend**: A modern React UI with summaries powered by **Groq** and a map visualization powered by **Leaflet.js**

---

### 🔙 Backend (`/backend`)

Built with **Python** and **Flask**, the backend is where the core AI logic resides.

- **`app.py`**  
  - The entry point of the Flask server  
  - Handles API requests (`/api/converse`)  
  - Manages in-memory conversation history  
  - Delegates AI logic to `one.py`

- **`one.py`**  
  The “brain” of the assistant. The `process_request()` function:
  - Analyzes the full conversation history
  - Determines user intent and shopping category
  - Uses `stores.json` to find matching inventory
  - Calculates recommendation scores based on **price**, **quality**, or **balanced**
  - Generates a natural-language response using the **Gemini API**

- **`stores.json`**  
  The "Digital Stockroom" – a static JSON file with:
  - Store metadata (name, location)
  - Inventory categorized by shopping themes

- **`requirements.txt`**  
  Lists all Python dependencies

---

### 💻 Frontend (`/chat-interface`)

A modern **React** application built with **Vite**.

- **`src/App.jsx`**  
  The main React component that:
  - Manages chat messages and user preferences
  - Makes API calls to the Flask backend
  - Displays conversational history
  - Shows store summaries powered by **Groq**
  - Embeds an interactive map using **React-Leaflet**

> 🛠️ *Note:* Linking map markers to chat recommendations is a planned future enhancement.

---

## ⚙️ Setup & Installation

### 🔧 Prerequisites

- Python 3.8+
- Node.js 16+
- A valid Google Gemini API key
- A valid Groq API key

---

## Prerequisites ##

    Python 3.8+ and packages listed in requirements.txt

    Node.js and npm

1. Backend Setup

    Navigate to the backend directory:

    cd backend

    Create and activate a virtual environment:
    For macOS/Linux:

    python3 -m venv venv
    source venv/bin/activate

    For Windows:

    py -m venv venv
    .\venv\Scripts\activate

    Install Python dependencies:

    pip install -r requirements.txt

    Set Your API Key:
    Open one.py and replace the placeholder "YOUR_API_KEY_HERE" with your actual Google Gemini API key.

2. Frontend Setup

    Navigate to the frontend directory from the project root:

    cd chat-interface

    Install Node.js dependencies:

    npm install

## Running the Application## 

You must have both the backend and frontend servers running simultaneously in separate terminal windows.

    Start the Backend Server:

        Make sure you are in the /backend directory with your virtual environment activated.

        Run the Flask application:

        python app.py

        The server will start and be listening on http://127.0.0.1:5001.

    Start the Frontend Server:

        Open a new terminal window.

        Navigate to the /chat-interface directory.

        Run the Vite development server:

        npm run dev

        Vite will automatically open the application in your default web browser, usually at http://localhost:5173.

You can now interact with the Shopping Assistant through the chat interface in your browser.

### A special thanks to our sponsors Google and Groq for helping us power our project! ###
