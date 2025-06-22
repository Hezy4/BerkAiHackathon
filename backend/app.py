# app.py - The Orchestrator (Unified Agent & Restored Stores API)

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import the primary function from our new unified "LLM Brain"
from agent import get_recommendation

# --- Constants ---
STORES_FILE = 'data/stores.json'

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)

# --- In-Memory Session Management ---
CONVERSATION_HISTORY = []

# --- Data Loading ---
try:
    with open(STORES_FILE, 'r') as f:
        STORES_DB = json.load(f)
    print(f"Successfully loaded {STORES_FILE} database.")
except FileNotFoundError:
    print(f"FATAL ERROR: {STORES_FILE} not found. Please ensure it's in the same directory as app.py.")
    STORES_DB = []


# --- API Routes ---

# This route is included to serve store data for the map on the frontend.
@app.route('/api/stores', methods=['GET'])
def get_stores():
    """An endpoint to serve the store data to the frontend."""
    return jsonify(STORES_DB)


@app.route('/api/converse', methods=['POST'])
def converse_with_agent():
    """A single endpoint that calls the primary agent brain."""
    global CONVERSATION_HISTORY

    user_data = request.json
    raw_request = user_data.get('request')
    preference = user_data.get('preference', 'balanced')
    
    if not raw_request:
        return jsonify({"error": "No request text provided."}), 400

    print("--- Pipeline Start ---")
    print(f"User Request: '{raw_request}', Preference: '{preference}'")
    
    # Call the LLM Brain (agent.py), which now handles all logic internally
    final_recommendation = get_recommendation(raw_request, CONVERSATION_HISTORY, STORES_DB, preference)
    
    # Update history
    CONVERSATION_HISTORY.append({"role": "user", "content": raw_request})
    CONVERSATION_HISTORY.append({"role": "model", "content": final_recommendation})
    
    print("--- Pipeline End: In-memory history updated. ---")

    return jsonify({"response": final_recommendation})

@app.route('/api/memory/clear', methods=['POST'])
def clear_memory():
    """An endpoint to wipe the in-memory conversation history."""
    global CONVERSATION_HISTORY
    CONVERSATION_HISTORY = []
    print("In-memory history has been cleared by user request.")
    return jsonify({"status": "Memory cleared successfully."})


# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

