# orchestrator.py  (5 lines that matter)
from letta import Agent
import json

agent_ing = Agent("agent-4f57b6ad-6e5c-4d3e-a6ca-2082e33a8c2b")     # Ingredient Resolver
agent_rec = Agent("agent-3914019f-6e8f-438d-92c3-605f38b79c9b")     # Store Recommender

def smartshop(user_text, mode="balanced"):
    # step 1  → ingredient list
    ing_json = json.loads(agent_ing.chat(user_text).content)["ingredients"]

    # step 2  → ranking answer
    return agent_rec.chat({
        "role":    "user",
        "content": json.dumps({"ingredients": ing_json, "mode": mode})
    }).content
