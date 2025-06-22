# two.py - Logic for Agent 2: The Recommender (LIVE & CONTEXT-AWARE)

import json
import google.generativeai as genai

# --- Configuration ---
# IMPORTANT: Replace "YOUR_API_KEY_HERE" with your actual key.
API_KEY = "AIzaSyDtVqk3C3ApjL2l0g7JKhH3HbUL5mAtt80" 
genai.configure(api_key=API_KEY)

llm = genai.GenerativeModel('gemini-1.5-flash')

def generate_recommendation(agent1_output: dict, preference: str, conversation_history: list) -> str:
    """
    Core logic for Agent 2.
    Takes filtered shopping options, calculates metrics, and uses the Gemini API
    to generate a natural language recommendation based on the conversation.
    """
    print("[Agent 2: Recommendation generation initiated.]")
    
    shopping_options = agent1_output.get('shoppingOptions', [])

    if not shopping_options:
        print("[Agent 2: No shopping options provided. Generating apology.]")
        return "I'm sorry, but it seems no single store has a complete set of matching items in stock for that request. Could you try being more specific or asking for something else?"

    # 1. Metric Augmentation & Sorting
    for option in shopping_options:
        details = option['matchedItemsDetails']
        total_price = sum(item['price'] for item in details)
        avg_quality = sum(item['qualityScore'] for item in details) / len(details) if details else 0
        
        option['totalPrice'] = round(total_price, 2)
        option['averageQuality'] = round(avg_quality, 2)

    if preference == 'price':
        shopping_options.sort(key=lambda x: x['totalPrice'])
    elif preference == 'quality':
        shopping_options.sort(key=lambda x: x['averageQuality'], reverse=True)
    else:  # 'balanced'
        shopping_options.sort(key=lambda x: x['averageQuality'] / x['totalPrice'] if x['totalPrice'] > 0 else 0, reverse=True)

    print(f"[Agent 2: Sorted stores by '{preference}'. Top choice: {shopping_options[0]['storeInfo']['name']}]")

    # 2. Construct Contextual Prompt for Gemini
    # THE FIX: We now provide the full data, including items, for each option. This allows for fact-checking and listing ingredients.
    top_options_for_prompt = []
    for option in shopping_options[:3]: # Limit to top 3 to keep the prompt clean
        store_name = option['storeInfo']['name']
        price = option['totalPrice']
        quality = option['averageQuality']
        # Include the list of items for each option
        items = [item['itemName'] for item in option['matchedItemsDetails']]
        top_options_for_prompt.append({
            "storeName": store_name,
            "totalPrice": f"${price:.2f}",
            "averageQuality": f"{quality:.1f}/10",
            "items": items
        })
    
    # Use json.dumps to create a clean, readable string of our data for the prompt
    formatted_options = json.dumps(top_options_for_prompt, indent=2)
    latest_user_request = conversation_history[-1]['content'] if conversation_history else ""

    prompt = f"""
    You are a concise and factual AI shopping assistant. Your goal is to give a direct and clear answer to the user's latest request using ONLY the provided data.

    <strong>User's Latest Request:</strong> "{latest_user_request}"
    
    <strong>Analysis Results (Ranked by user preference: '{preference}'):</strong>
    ```json
    {formatted_options}
    ```

    <strong>Your Task:</strong>
    Based on the user's latest request and the ranked analysis results, provide a helpful response.
    1.  <strong>Fact-Check Everything</strong>: Your response MUST be based *exclusively* on the data provided in the "Analysis Results". Do not invent or misstate prices or quality scores.
    2.  <strong>Recommend & List Items</strong>: When recommending an option, you MUST state the store name, total price, quality score, AND the full list of items that make up that recommendation.
    3.  <strong>Handle Follow-ups</strong>: If the user asks for "more quality" or an "alternative", recommend the next best option from the ranked list, again including all its details (store, price, quality, items).
    4.  <strong>Be Direct</strong>: Keep your response concise and to the point. Use HTML <strong> tags to emphasize key information.
    
    Example response:
    "For the best <strong>quality</strong>, I recommend <strong>Organic Emporium</strong>. The total cost is $25.50 for an average quality of 9.5/10. The items included are: organic flour, organic eggs, organic milk, and organic butter."
    """
    print("[Agent 2: Sending final prompt to Gemini for recommendation text...]")
    try:
        response = llm.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"[Agent 2: FATAL ERROR generating recommendation. Error: {e}]")
        return "I had a short circuit in my recommendation circuits. Please try again."
