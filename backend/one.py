# one.py - Logic for Agent 1: The Analyst (LIVE & TESTABLE)

import os
import json
import google.generativeai as genai

# --- Configuration ---
# IMPORTANT: Replace "YOUR_API_KEY_HERE" with the actual key you provided.
# For better security, load this from an environment variable in a real project.
API_KEY = "AIzaSyC0ldRJhUlCKMansoNzoiLbocjR2TI-bZ4" 
genai.configure(api_key=API_KEY)

# Initialize the generative model
# We use gemini-1.5-flash for speed and efficiency, perfect for a hackathon.

llm = genai.GenerativeModel('gemini-1.5-flash')

def _find_semantic_matches_in_store(items_needed: list, store: dict) -> dict:
    """
    Helper function that uses an LLM to semantically match needed items
    with a specific store's available inventory.
    """
    print(f"[Agent 1.5: Running semantic match for '{store['name']}'...]")
    store_inventory_names = [item['itemName'] for item in store['inventory'] if item['inStock']]

    prompt = f"""
    You are a precise inventory matching expert. Your only task is to determine if a user's shopping list can be **completely** fulfilled by a specific store's inventory.

    **User's Shopping List:**
    {items_needed}

    **Store's Available Inventory:**
    {store_inventory_names}

    **Instructions:**
    1. For each item in the "User's Shopping List", find the single best-matching item from the "Store's Available Inventory".
    2. The match should be conceptual. For example, if the user wants "mid-range graphics card", and the inventory has "Nvidia GeForce RTX 5070", that is a valid match.
    3. **If you cannot find a reasonable match for even ONE item, the entire match fails.**

    **Output Format (Strict):**
    Respond with ONLY a valid JSON object with a single key "matched_items".
    - If ALL items are successfully matched, "matched_items" MUST be a list of the *exact* item names from the store's inventory.
    - If ANY item cannot be matched, "matched_items" MUST be `null`.
    """
    try:
        response = llm.generate_content(prompt)
        clean_response_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        llm_output = json.loads(clean_response_text)
        return llm_output
    except Exception as e:
        print(f"[Agent 1.5: FATAL ERROR parsing match response. Error: {e}\nRaw Text: {response.text}]")
        return {"matched_items": None}


def analyze_and_find_stores(raw_request: str, conversation_history: list, stores_db: list) -> dict:
    """
    Core logic for Agent 1. Now with a two-stage process for semantic matching.
    """
    print("\n[Agent 1: Context-aware analysis initiated...]")

    if not raw_request:
        return {"error": "No request text provided."}

    full_conversation_for_prompt = conversation_history + [{"role": "user", "content": raw_request}]
    formatted_history = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in full_conversation_for_prompt])
    
    prompt_stage1 = f"""
    You are an expert shopping list analyst. Your task is to analyze the conversation and generate a definitive shopping list based on the user's most recent request.

    **Full Conversation Transcript:**
    {formatted_history}

    **Your Reasoning Process:**
    1.  **Analyze Intent**: Determine if the "Latest User Request" is a follow-up/modification to the immediately preceding topic OR if it is a **completely new topic**.
    2.  **Handle Topic/Tier Changes**: If the latest request is a new topic or a different version of the same topic (e.g., "less expensive PC"), **IGNORE** previous lists and generate a **NEW** list.
    3.  **Handle Q&A**: If the request is a simple question about the previous turn (e.g., "what are the parts?"), **re-affirm the previous list**.

    **Your Task:**
    Based on your reasoning, perform two final actions:
    1.  **Extract Final Items**: Create the single, definitive list of products the user needs now. For conceptual requests (e.g., "budget PC"), generate a reasonable list of specific components.
    2.  **Classify Final Category**: Determine the single, most appropriate shopping category for the final list from this list: {list(set(s['category'] for s in stores_db))}.

    **Output Format:**
    Respond with ONLY a valid JSON object with "items" and "category" keys.
    """
    print("[Agent 1: Sending Stage 1 prompt to Gemini...]")
    try:
        response_stage1 = llm.generate_content(prompt_stage1)
        clean_response_text = response_stage1.text.strip().replace("```json", "").replace("```", "").strip()
        llm_output = json.loads(clean_response_text)
    except Exception as e:
        print(f"[Agent 1: FATAL ERROR - Could not parse Stage 1 response. Error: {e}\nRaw Text: {response_stage1.text}]")
        return {"error": "Failed to get a valid analysis from the AI model."}

    items_needed = llm_output.get("items", [])
    store_category = llm_output.get("category")
    print(f"[Agent 1: Stage 1 complete. Identified: {items_needed}, Category: {store_category}]")
    
    if not items_needed or not store_category:
        return {"shoppingOptions": []}

    relevant_stores = [store for store in stores_db if store.get('category') == store_category]
    shopping_options = []

    for store in relevant_stores:
        match_result = _find_semantic_matches_in_store(items_needed, store)
        
        if match_result and match_result.get("matched_items"):
            matched_item_names = match_result["matched_items"]
            
            option = {
                "storeInfo": {k: v for k, v in store.items() if k != 'inventory'},
                "matchedItemsDetails": [
                    item for item in store['inventory'] if item['itemName'] in matched_item_names
                ]
            }
            shopping_options.append(option)
            print(f"[Agent 1.5: SUCCESS! Found a valid shopping option at '{store['name']}'.]")
        else:
            print(f"[Agent 1.5: FAILED. '{store['name']}' does not have all required items.]")

    print(f"\n[Agent 1: Stage 2 complete. Found {len(shopping_options)} viable shopping options.]")
    
    return {"shoppingOptions": shopping_options}
