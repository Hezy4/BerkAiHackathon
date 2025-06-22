import os
import json

from groq import Groq

filepath = "verysmallstoreprice.json"

def load_json_file(filepath):
    with open(filepath, 'r') as f:
        data = json.load(f)
    return data

storename = "good earth natural foods"
json_data = load_json_file('verysmallstoreprice.json')
json_string = json.dumps(json_data, indent=2)  # indent for readability in the prompt

client = Groq(
#
    api_key="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"

)


chat_completion = client.chat.completions.create(

    messages=[

        {

            "role": "system",

            "content": "You are an assistant that analyzes JSON data.",


        },

        {

            "role": "user",

            "content": f"Analyze the following JSON data: {json_string}"+" give a summary of "+ storename + "in about 40 words. Focus on summarizing rather than raw numbers",


        }

    ],

    model="llama-3.3-70b-versatile",

)


print(chat_completion.choices[0].message.content)