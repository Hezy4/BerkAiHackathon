# 🛍️ AI-Powered Shopping Assistant

## 🧠 Overview

This project is an AI-powered shopping assistant that helps users find the best local options for their shopping needs through a natural language interface. The system understands complex shopping requests and provides personalized recommendations based on user preferences (price, quality, or balanced approach).

## 🏗️ System Architecture

The application follows a client-server architecture with the following components:

### 🔙 Backend (Python/Flask)

The backend serves as the brain of the application, handling all AI processing and data management.

#### Core Components:

1. **`app.py` - Main Application Server**
   - Initializes the Flask application and CORS middleware
   - Manages in-memory conversation history
   - Provides RESTful API endpoints:
     - `GET /api/stores`: Retrieves store information for map visualization
     - `POST /api/converse`: Main endpoint for processing user requests
     - `POST /api/clear`: Clears conversation history
   - Loads and manages store inventory data

2. **`agent.py` - AI Recommendation Engine**
   - Implements the core recommendation logic using Google's Gemini API
   - Key functions:
     - `get_recommendation()`: Main entry point that processes user requests
     - `_assemble_list_from_inventory()`: Helper function that builds shopping lists from store inventory
   - Handles natural language understanding and response generation
   - Manages conversation context and history

3. **Data Management**
   - `data/stores.json`: Contains store information and inventory data
   - In-memory storage for conversation history

### 🌐 Frontend (React/Vite)

Modern web interface that provides a seamless user experience.

#### Key Features:
- Interactive chat interface
- Real-time map visualization using Leaflet.js
- Responsive design for various screen sizes
- Integration with backend API endpoints

## 🛠️ Technical Stack

### Backend
- **Framework**: Flask (Python)
- **AI/ML**: Google Gemini API
- **Data Storage**: JSON-based storage for stores and inventory
- **API**: RESTful endpoints

### Frontend
- **Framework**: React
- **Maps**: Leaflet.js
- **Build Tool**: Vite
- **Styling**: CSS Modules

## 🔄 Data Flow

1. User submits a request through the frontend chat interface
2. Request is sent to the backend's `/api/converse` endpoint
3. Backend processes the request using the AI recommendation engine
4. System queries store inventory and generates recommendations
5. Response is formatted and sent back to the frontend
6. Frontend updates the UI with the response and any relevant map data

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- Google Gemini API key

### Installation
1. Clone the repository
2. Install backend dependencies: `pip install -r requirements.txt`
3. Install frontend dependencies: `cd frontend/chat-interface && npm install`
4. Set up your environment variables (API keys, etc.)

### Running the Application
1. Start the backend: `python backend/app.py`
2. Start the frontend: `cd frontend/chat-interface && npm run dev`
3. Access the application at `http://localhost:5173`

## 🤖 AI Capabilities

The system demonstrates several advanced AI capabilities:

1. **Natural Language Understanding**
   - Processes complex, conversational shopping requests
   - Understands context from previous messages
   - Handles ambiguous or incomplete requests

2. **Recommendation Engine**
   - Suggests complete shopping lists based on user goals
   - Considers multiple factors (price, quality, availability)
   - Provides alternatives when exact matches aren't available

3. **Context Management**
   - Maintains conversation history
   - Remembers user preferences
   - Handles follow-up questions naturally

## 📊 Data Model

The application uses a simple but effective data model:

- **Stores**: Physical locations with inventory
- **Inventory**: Products available at each store
- **Conversation History**: User and assistant message history
- **User Preferences**: Stated preferences for recommendations

## 🔄 API Endpoints

### `GET /api/stores`
- Returns: List of all stores with their inventory
- Used by: Frontend map visualization

### `POST /api/converse`
- Payload: `{ "request": string, "preference": "price|quality|balanced" }`
- Returns: AI-generated response with recommendations
- Used by: Frontend chat interface

### `POST /api/clear`
- Clears the conversation history
- Returns: Success status
- Used by: Frontend reset functionality

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
