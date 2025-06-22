# one.py - The Data Cruncher (No LLM)

def find_stores_with_items(items_needed: list, category: str, stores_db: list) -> list:
    """
    A simple, non-AI function to find stores that have all the required items.
    It performs a case-insensitive match against the store's inventory.
    """
    print(f"[Agent 1 - Data Cruncher: Searching for {len(items_needed)} items in category '{category}']")
    
    relevant_stores = [store for store in stores_db if store.get('category') == category]
    qualified_options = []

    print(f"[Agent 1 - Data Cruncher: Found {len(relevant_stores)} relevant store(s).]")

    for store in relevant_stores:
        # Create a quick-access map of the store's inventory for efficient lookups
        inventory_map = {item['itemName'].lower(): item for item in store['inventory'] if item['inStock']}
        
        all_items_found = True
        matched_item_details = []

        for needed_item in items_needed:
            match = inventory_map.get(needed_item.lower())
            if match:
                matched_item_details.append(match)
            else:
                # If even one item isn't found, this store is not a valid option.
                print(f"Store '{store['name']}' is missing item: '{needed_item}'")
                all_items_found = False
                break
        
        if all_items_found:
            # If all items were found, package this store and its matching items as a valid option
            option = {
                "storeInfo": {k: v for k, v in store.items() if k != 'inventory'}, 
                "matchedItemsDetails": matched_item_details
            }
            qualified_options.append(option)
            print(f"[Agent 1: SUCCESS! Found a complete match at '{store['name']}'.]")
            
    return qualified_options
