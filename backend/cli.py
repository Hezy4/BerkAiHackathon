# cli.py - Command-Line Interface for the Multi-Agent Shopping Assistant

import requests
import json
import textwrap

# The address of our running Flask backend
API_BASE_URL = "http://127.0.0.1:5001"

def clear_server_memory():
    """Sends a request to the backend to clear the conversation history."""
    try:
        response = requests.post(f"{API_BASE_URL}/api/memory/clear")
        if response.status_code == 200:
            print("\n[System] Memory cleared. Ready for a fresh start.")
        else:
            print(f"\n[Error] Could not clear memory. Server responded with: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("\n[Fatal Error] Could not connect to the backend server. Is app.py running?")

def main():
    """Main function to run the interactive CLI."""
    print("--- Multi-Agent Shopping Assistant CLI ---")
    print("Type 'quit' or 'exit' to close.")
    print("Type 'clear' to reset the conversation memory.")
    print("Set preference with 'pref price', 'pref quality', or 'pref balanced'.")
    print("-" * 40)

    # Initialize the preference. It will be sticky until changed.
    preference = 'balanced'

    while True:
        # Get user input
        user_input = input("\nYou: ")

        if user_input.lower() in ['quit', 'exit']:
            print("\n[System] Shutting down CLI. Goodbye.")
            break
        
        if user_input.lower() == 'clear':
            clear_server_memory()
            continue

        if user_input.lower().startswith('pref '):
            new_pref = user_input.split(' ', 1)[1].lower()
            if new_pref in ['price', 'quality', 'balanced']:
                preference = new_pref
                print(f"[System] Preference set to: {preference}")
            else:
                print("[System] Invalid preference. Choose from: price, quality, balanced.")
            continue

        # Prepare the data payload for the API
        payload = {
            "request": user_input,
            "preference": preference
        }

        try:
            # Send the request to our backend
            print("[System] Sending request to agents...")
            response = requests.post(f"{API_BASE_URL}/api/converse", json=payload)
            response.raise_for_status()  # Raises an exception for bad status codes (4xx or 5xx)

            # Parse the JSON response
            response_data = response.json()
            recommendation = response_data.get("recommendation", "No recommendation received.")

            # Print the formatted response from Agent 2
            print("\nAgent:")
            print(recommendation)

        except requests.exceptions.ConnectionError:
            print("\n[Fatal Error] Could not connect to the backend server. Please ensure app.py is running.")
        except requests.exceptions.HTTPError as e:
            print(f"\n[HTTP Error] The server responded with an error: {e.response.status_code}")
            # Try to print the error message from the server if it exists
            try:
                error_details = e.response.json()
                print(f"Server message: {error_details.get('error', 'No details provided.')}")
            except json.JSONDecodeError:
                print("Could not parse error response from server.")
        except Exception as e:
            print(f"\n[An unexpected error occurred]: {e}")


if __name__ == "__main__":
    main()
