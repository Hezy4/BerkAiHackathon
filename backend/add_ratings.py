import json
import random

def add_ratings():
    # Load the stores data
    with open('data/stores.json', 'r') as f:
        data = json.load(f)
    
    # Add a random rating between 3.0 and 5.0 to each store
    for store in data:
        # Generate a random rating between 3.0 and 5.0 with one decimal place
        store['rating'] = round(random.uniform(3.0, 5.0), 1)
    
    # Save the updated data back to the file
    with open('data/stores.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Added ratings to {len(data)} stores.")

if __name__ == "__main__":
    add_ratings()
