import os
from langchain.callbacks import  FileCallbackHandler
from langchain.chat_models import ChatOpenAI

handler = FileCallbackHandler("output.txt")
openai_api_key = os.environ.get("OPENAI_API_KEY")

gpt35 = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0, openai_api_key=openai_api_key, streaming=True, max_tokens=500, callbacks=[handler])
gpt4 = ChatOpenAI(model_name="gpt-4", temperature=0, openai_api_key=openai_api_key, streaming=True, max_tokens=250)
