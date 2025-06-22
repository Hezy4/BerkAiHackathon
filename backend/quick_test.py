# quick_test.py
from orchestrator import talk, AGENT1_ID, AGENT2_ID
from orchestrator import storeInfo

# Send data to agents
user_request = input("\nwhat ingredients do you want? (press enter to continue)\n")

agentOne = talk(AGENT1_ID, user_request)
agentOneProcessed = ("AGENT ONE HERE: Heres the data you need to provide the user with the help they need. do not reply to me, reply to them. Store Info (JSON Format): \n(START OF FILE)\n" + storeInfo + "\n(END OF FILE)\nthe ingredients needed (JSON Format): " + agentOne + ". NOW: return the recommendation. ")
agentTwo = talk(AGENT2_ID, agentOneProcessed)
#print reply from agent 2
print(agentTwo)

#leave the chat open for follow up questions 
while True:
    userReply = input("\nAny questions?\n\n")
    agentTwo = talk(AGENT2_ID, userReply)
    print(agentTwo)
    if userReply == "break" or userReply=="quit":

        break
