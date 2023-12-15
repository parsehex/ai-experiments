import requests
import os
import sys
import time
import yaml

BASE_URL = "http://localhost:5000"

def save_msgs(filename, messages):
	content = ""
	if isinstance(messages, list):
		for msg in messages:
			msg['content'] = msg['content'].replace("\'", "'")
			content += msg['role'] + ": " + msg['content'] + "\n"
	else:
		content = messages
	directory = os.path.dirname(filename)
	if not os.path.exists(directory):
		os.makedirs(directory)
	# does file exist? if so, increment filename
	if os.path.exists(filename):
		i = 1
		ext = filename.split(".")[-1]
		while os.path.exists(filename):
			filename = filename.replace(f".{ext}", f"_{i}.{ext}")
			i += 1
	with open(filename, "w") as f:
		f.write(content)

def message(content, role="user"):
	return {
		"role": role,
		"content": content
	}

def genMsg(data=None):
	endpoint = "/v1/chat/completions"
	url = BASE_URL + endpoint

	response = requests.post(url, json=data)
	res = response.json()
	if response.status_code != 200:
		raise Exception(f"Error calling API: {res['error']}")
	return res["choices"][0]["message"]

def run_prompt(prompt):
	messages = [message(prompt)]
	msg = genMsg({ "messages": messages })
	messages.append(msg)
	return messages

def run_multi_step_prompt(prompts):
	# we need to run the first one, then run the next with the previous response
	messages = []
	for i, prompt in enumerate(prompts):
		if i == 0:
			messages = run_prompt(prompt)
		else:
			messages.append(message(prompt, 'user'))
			messages.append(genMsg({ "messages": messages }))
	return messages

def run_tests(prompts, repeat_count, name="test"):
	for _ in range(repeat_count):
		for prompt in prompts:
			# get current time
			start = time.time()
			# response = None
			messages = []
			if isinstance(prompt, list):
				messages = run_multi_step_prompt(prompt)
			else:
				messages = run_prompt(prompt)
			p = os.path.abspath(__file__)
			p = f"{os.path.dirname(p)}/logs/{name}-{_}.txt"
			save_msgs(p, messages)

			end = time.time()
			print(f"Completed prompt in {end - start}s ({_ + 1}/{repeat_count})")

			# if response is None:
			# 	continue
			# tokens = response['usage']['completion_tokens']
			# tps = tokens / (end - start)
			# print(f"Time taken: {end - start} seconds ({tps} tokens per second)")

if __name__ == "__main__":
	testname = sys.argv[1]
	repeat_count = sys.argv[2]
	p = os.path.abspath(__file__)
	p = f"{os.path.dirname(p)}/tests/{testname}.yaml"
	with open(p, "r") as f:
		prompts = yaml.load(f, Loader=yaml.FullLoader)
	repeat_count = int(repeat_count)
	prompts = prompts['prompts']
	run_tests(prompts, repeat_count, testname)
