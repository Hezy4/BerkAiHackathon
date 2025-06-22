AI-Powered Shopping Assistant
Overview

This project is an advanced, AI-powered shopping assistant designed to help users find the best local options for their shopping needs. It features a conversational chat interface where users can make natural language requests (e.g., "I need to build a budget gaming PC," "what do I need for pancakes?") and receive intelligent, context-aware recommendations.

The application is comprised of two main components:

    A Python Flask Backend that houses the AI logic, powered by the Google Gemini API.

    A React Frontend that provides a user-friendly chat interface and a Leaflet.js map for visualizing store locations.

Architecture
Backend (/backend)

The backend is built with Python and Flask, and its core intelligence resides in a unified agent model.

    app.py: The main Flask server application. It acts as the central controller, handling API requests, managing the conversation history (in-memory for the current session), and calling the primary agent logic.

    one.py: This is the "brain" of the operation. It contains a single, powerful, unified agent (process_request) that:

        Analyzes the full conversation history to determine the user's intent and shopping category.

        Assembles a list of required items by consulting the stores.json inventory, ensuring all recommendations are grounded in real-world stock.

        Calculates metrics (price, quality) for all valid shopping options.

        Sorts the options based on user preference (price, quality, or balanced).

        Uses the Gemini API to formulate a final, helpful, natural-language response.

    stores.json: The "Digital Stockroom." A static JSON file containing all store data, including categories, locations, and detailed inventories.

    requirements.txt: Lists all necessary Python dependencies.

Frontend (/chat-interface)

The frontend is a modern React application built with Vite.

    src/App.jsx: The main component that renders both the chat interface and the map. It manages all frontend state, including chat messages and user preferences.

    Functionality:

        Makes API calls to the /api/converse endpoint on the Flask backend.

        Displays the conversational history between the user and the AI agent.

        Provides controls for theme and recommendation preference.

        Integrates a react-leaflet map to display store locations (functionality for linking chat recommendations to the map is a potential future enhancement).

Setup & Installation
Prerequisites

    Python 3.8+ and Pip

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

Running the Application

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