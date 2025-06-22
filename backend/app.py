# app.py - The Central Controller (In-Memory Session Version)

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import the logic from our two agent modules
from one import analyze_and_find_stores
from two import generate_recommendation

# --- Constants ---
STORES_FILE = 'data/stores.json'

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)

# --- In-Memory Session Management ---
# The conversation history is now stored in a simple global variable.
# It will be reset every time the server application is restarted.
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
@app.route('/api/converse', methods=['POST'])
def converse_with_agents():
    """A single endpoint that runs the full two-agent pipeline using in-memory context."""
    global CONVERSATION_HISTORY # Declare that we intend to modify the global variable

    user_data = request.json
    raw_request = user_data.get('request')
    preference = user_data.get('preference', 'balanced')
    
    if not raw_request:
        return jsonify({"error": "No request text provided."}), 400

    print("--- Pipeline Start ---")
    print(f"User Request: '{raw_request}', Preference: '{preference}'")
    
    # Step 1: Call Agent 1, passing the current in-memory history
    agent1_output = analyze_and_find_stores(raw_request, CONVERSATION_HISTORY, STORES_DB)
    
    if agent1_output.get("error"):
        return jsonify(agent1_output), 400
    
    # Update history in memory AFTER Agent 1 succeeds
    CONVERSATION_HISTORY.append({"role": "user", "content": raw_request})

    # Step 2: Call Agent 2 with the updated history
    final_recommendation = generate_recommendation(agent1_output, preference, CONVERSATION_HISTORY)
    
    # Add the final response to the in-memory history
    CONVERSATION_HISTORY.append({"role": "model", "content": final_recommendation})
    
    print("--- Pipeline End: In-memory history updated. ---")
    
    # Return the final response to the frontend
    return jsonify({
        "response": final_recommendation,
        "status": "success"
    })

@app.route('/api/memory/clear', methods=['POST'])
def clear_memory():
    """An endpoint to wipe the in-memory conversation history for the current session."""
    global CONVERSATION_HISTORY
    CONVERSATION_HISTORY = []
    print("In-memory history has been cleared by user request.")
    return jsonify({"status": "Memory cleared successfully."})


# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

