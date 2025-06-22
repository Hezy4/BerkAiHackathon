#agent.py - Logic for Agent 1: The Recommender (LIVE & CONTEXT-AWARE)

import json
import google.generativeai as genai

# --- Configuration ---
# IMPORTANT: Replace "YOUR_API_KEY_HERE" with your actual key.
API_KEY = "INSERT_API_KEY_HERE!" 
genai.configure(api_key=API_KEY)

llm = genai.GenerativeModel('gemini-1.5-flash')

def _assemble_list_from_inventory(user_request: str, store: dict) -> dict:
    """
    This helper function, formerly in one.py, tries to build a list for a conceptual 
    request using ONLY the inventory of a single store.
    """
    print(f"[Unified Agent: Attempting to build '{user_request}' from '{store['name']}' inventory...]")
    store_inventory_names = [item['itemName'] for item in store['inventory'] if item['inStock']]

    prompt = f"""
    You are a resourceful shopping assistant. Your task is to act as a personal shopper for a user at a specific store.

    **User's Goal:** "{user_request}"

    **This Store's Available Inventory:**
    {store_inventory_names}

    **Your Task:**
    Based on the user's goal, assemble a complete and reasonable shopping list using ONLY items from the store's inventory.
    - If the user wants a "sandwich", select a type of bread, a protein, a cheese, and a condiment from the inventory.
    - If you cannot create a reasonable and complete list to satisfy the user's goal with the given inventory, you must indicate failure.

    **Output Format (Strict):**
    Respond with ONLY a valid JSON object with a single key "assembled_list".
    - If you can assemble a complete list, "assembled_list" MUST be a list of the *exact* item names you used from the store's inventory.
    - If you cannot assemble a complete list, "assembled_list" MUST be `null`.
    """
    try:
        response = llm.generate_content(prompt)
        clean_response_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        llm_output = json.loads(clean_response_text)
        return llm_output
    except Exception as e:
        print(f"[Unified Agent: FATAL ERROR parsing assembly response. Error: {e}\nRaw Text: {response.text}]")
        return {"assembled_list": None}


def get_recommendation(raw_request: str, conversation_history: list, stores_db: list, preference: str) -> str:
    """
    This is the new primary function. It orchestrates the entire process.
    """
    print("\n[Unified Agent: Processing request...]")

    # Step 1: Determine Category
    full_conversation_for_prompt = conversation_history + [{"role": "user", "content": raw_request}]
    history_prompt = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in full_conversation_for_prompt])
    
    # THE FIX: Hardcode the valid categories as requested by the user for reliability.
    valid_categories = ["Groceries", "Hardware", "Electronics", "Gas"]

    prompt_category = f"""
    Analyze the conversation and determine the single most relevant shopping category for the user's latest request.

    **Conversation History:**
    {history_prompt}

    **Valid Categories:** {valid_categories}

    You MUST choose one of the "Valid Categories". Do not invent a new one.
    Respond with ONLY a valid JSON object with a single key "category".
    Example: {{"category": "Groceries"}}
    """
    print("[Unified Agent: Step 1 - Determining Category...]")
    try:
        response = llm.generate_content(prompt_category)
        clean_response_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        llm_output = json.loads(clean_response_text)
        store_category = llm_output.get("category")
        if store_category not in valid_categories:
            print(f"[Unified Agent: ERROR - Invalid category '{store_category}' returned.]")
            # If the AI fails, we try to infer the category from the text as a fallback
            for cat in valid_categories:
                if cat.lower() in raw_request.lower():
                    store_category = cat
                    break
            else:
                 return "I'm not sure which category of store to look at for that request. Could you be more specific?"
    except Exception as e:
        print(f"[Unified Agent: FATAL ERROR in Step 1. Error: {e}]")
        return "I'm having trouble understanding your request. Could you please rephrase?"
    
    print(f"[Unified Agent: Category locked: {store_category}]")

    # Step 2: Assemble Options
    relevant_stores = [store for store in stores_db if store.get('category') == store_category]
    shopping_options = []
    
    for store in relevant_stores:
        assembly_result = _assemble_list_from_inventory(raw_request, store)
        if assembly_result and assembly_result.get("assembled_list"):
            option = {
                "storeInfo": {k: v for k, v in store.items() if k != 'inventory'}, 
                "matchedItemsDetails": [item for item in store['inventory'] if item['itemName'] in assembly_result["assembled_list"]]
            }
            shopping_options.append(option)
    
    if not shopping_options:
        return "I'm sorry, but after checking the local stores, I couldn't assemble a complete shopping list for that request."

    # Step 3: Augment, Sort, and Respond
    for option in shopping_options:
        details = option['matchedItemsDetails']
        option['totalPrice'] = round(sum(item['price'] for item in details), 2)
        option['averageQuality'] = round(sum(item['qualityScore'] for item in details) / len(details) if details else 0, 1)

    if preference == 'price':
        shopping_options.sort(key=lambda x: x['totalPrice'])
    elif preference == 'quality':
        shopping_options.sort(key=lambda x: x['averageQuality'], reverse=True)
    else:
        shopping_options.sort(key=lambda x: x['averageQuality'] / x['totalPrice'] if x['totalPrice'] > 0 else 0, reverse=True)

    top_options_for_prompt = []
    for option in shopping_options[:3]:
        top_options_for_prompt.append({
            "storeName": option['storeInfo']['name'],
            "totalPrice": f"${option['totalPrice']:.2f}",
            "averageQuality": f"{option['averageQuality']}/10",
            "items": [item['itemName'] for item in option['matchedItemsDetails']]
        })

    prompt_final = f"""
    You are a concise and witty AI shopping assistant. Your goal is to give a direct and clear answer to the user's latest request using ONLY the provided data.
    **User's Latest Request:** "{raw_request}"
    **Analysis Results (Ranked by preference '{preference}'):**
    ```json
    {json.dumps(top_options_for_prompt, indent=2)}
    ```
    **Your Task:** Formulate a helpful, conversational response.
    - For an initial query, recommend the #1 store, explaining why it's best based on the preference, and list the items.
    - If the user asks for alternatives, recommend the #2 store.
    - If the user asks a specific question (like "how much?"), answer it directly for the #1 store.
    """
    print("[Unified Agent: Step 3 - Generating final response...]")
    try:
        final_response = llm.generate_content(prompt_final)
        print("DEBUG: " + final_response.text)
        return final_response.text
    except Exception as e:
        print(f"[Unified Agent: FATAL ERROR generating final response. Error: {e}]")
        return "I had a short circuit in my final recommendation circuits."
