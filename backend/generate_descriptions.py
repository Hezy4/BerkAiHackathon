import json
import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Groq client
try:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
except Exception as e:
    print("Error initializing Groq client. Make sure GROQ_API_KEY is set in .env file.")
    print(f"Error: {str(e)}")
    exit(1)

def generate_store_description(store):
    """Generate a detailed and engaging description for a store using Groq AI"""
    name = store['name']
    tags = store.get('tags', {})
    category = store.get('category', 'grocery store')
    
    # Prepare the prompt with strict instructions for a very concise description
    prompt = f"""Write exactly 3 sentences maximum describing "{name}", a {category}. """
    
    # Add location context if available
    if 'addr:street' in tags and 'addr:city' in tags:
        prompt += f"The store is located at {tags['addr:street']} in {tags['addr:city']}. "
    
    # Add specific instructions for conciseness and quality
    prompt += """
    RULES:
    - Must be 1-3 complete sentences only
    - Maximum of 3 sentences total
    - Each sentence should be clear and concise
    - Focus on what makes this store unique
    - Include key products or services
    - Keep it engaging but professional
    - No bullet points or lists
    - No quotation marks
    - No line breaks or paragraph breaks
    
    Example format (but specific to this store):
    "Store Name offers quality products in a welcoming environment. Our specialty is X and Y. Customers love our Z."
    """
    
    # Add inventory context if available
    if 'inventory' in store and store['inventory']:
        # Get unique categories from inventory
        categories = list(set(item.get('category', '') for item in store['inventory'] if item.get('category')))
        if categories:
            prompt += f"\nThe store offers products in categories like: {', '.join(categories[:5])}."
    
    # Add rating context if available
    rating = store.get('rating')
    if rating is not None:
        prompt += f" With a rating of {rating}, "
        if float(rating) >= 4.0:
            prompt += "it's a customer favorite known for its quality and service."
        else:
            prompt += "it provides good value to the local community."
    
    prompt += """
    The description should be written in a friendly, conversational tone that makes customers want to visit.
    Avoid using the store's name more than once in the description.
    """
    
    try:
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that writes engaging store descriptions."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama3-8b-8192",
            temperature=0.7,
            max_tokens=150,
            top_p=1,
        )
        
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating description for {name}: {str(e)}")
        return f"{name} is a local grocery store offering a variety of products."

def main():
    # Path to the stores.json file
    input_file = "../frontend/chat-interface/public/data/stores.json"
    backup_file = "../frontend/chat-interface/public/data/stores_backup.json"
    
    # Create a backup of the original file
    import shutil
    shutil.copy2(input_file, backup_file)
    print(f"Created backup at {backup_file}")
    
    # Read the existing data
    try:
        with open(input_file, 'r') as f:
            stores = json.load(f)
    except Exception as e:
        print(f"Error reading {input_file}: {str(e)}")
        return
    
    # Process each store
    for i, store in enumerate(stores):
        print(f"Processing store {i+1}/{len(stores)}: {store['name']}")
        
        # Remove existing description if it exists
        if 'tags' in store and 'description' in store['tags']:
            del store['tags']['description']
            
        # Generate new description
        description = generate_store_description(store)
        
        # Add description to store data
        if 'tags' not in store:
            store['tags'] = {}
        store['tags']['description'] = description
        
        print(f"  - Added description: {description[:80]}...")
        
        # Save after each store in case of errors
        with open(input_file, 'w') as f:
            json.dump(stores, f, indent=2)
    
    print(f"\nUpdated {len(stores)} stores with descriptions in {input_file}")

if __name__ == "__main__":
    main()
