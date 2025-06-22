# orchestrator.py
import json
from letta_client import Letta, MessageCreate

LE = Letta(token="sk-let-OTc4ZTdiMWEtZjkwNi00NDkyLTg3MTUtYmMzMjI0N2RmZGM1OjQ5MWU4MmZjLTMzMmMtNDMyYy1hMmYwLWJiYzI3YWQyMTI0MQ==")

AGENT1_ID = "agent-4f57b6ad-6e5c-4d3e-a6ca-2082e33a8c2b"   # Ingredient Resolver
AGENT2_ID = "agent-3914019f-6e8f-438d-92c3-605f38b79c9b"   # Store Recommender

filepath = "data/storepriceTEST.json"

def load_json_file(filepath):
    with open(filepath, 'r') as f:
        data = json.load(f)
    return data

def talk(agentid, user_message) -> str:

    resp = LE.agents.messages.create(
        agent_id=agentid,
        messages=[MessageCreate(role="user", content=user_message)]
    )
    return resp.messages[-1].content      # already a simple string

storename = ""
json_data = load_json_file('data/storepriceTEST.json')

storeInfo = json.dumps(json_data, indent=2)  # indent for readability in the prompt
