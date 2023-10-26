from langchain.tools import Tool
from langchain.utilities import GoogleSearchAPIWrapper
from langchain.chains import SequentialChain, LLMChain
from langchain.prompts import PromptTemplate
from llms import gpt35
from reader import SimpleReaderTool
# from langchain.callbacks import FileCallbackHandler
# handler = FileCallbackHandler("gsearch.txt")

search = GoogleSearchAPIWrapper()
reader_tool = SimpleReaderTool(description="use this to read a website, input should be a URL and nothing else")

def top5_results(query):
	results = search.results(query, 5)
	keys = list(results[0].keys())
	print(keys)
	response = "These are the top 5 search results with their title and link, and snippet.:\n\n"
	for result in results:
		response += f"{result['title']}\n{result['link']}\n{result['snippet']}\n\n"


if locals().get('handler'):
	handler = locals()['handler']
	tool = Tool(
		name="GSearch",
		description="Search Google for recent results.",
		func=top5_results,
		callbacks=[handler],
		input_keys=['query'],
	)
else:
	tool = Tool(
		name="GSearch",
		description="Search Google for recent results.",
		func=top5_results,
		input_keys=['query'],
	)


search_query_generator = LLMChain(llm=gpt35, prompt=PromptTemplate(template="Generate a search query that satisfies the given input: {query}", input_variables=['query']))
search_chain = SequentialChain(chains=[search_query_generator, tool], input_variables=['query'], input_keys=['query'])
# results = search_chain.run(context="langchain")
