# this is a module for constructing the proper prompt format
#   for a specified llm model, from a list of so-called "prompt parts"
#   which are a shorthand format for constructing a prompt that
#   can be constructed into any format

# parts is a list of objects
#   each object is a prompt part
# each prompt part has at least a `str` propertyn and optionally:
#   - `if`: boolean indicating whether to include this part in the prompt
#   - `pre`: string to add before the part
#   - `suf`: string to add after the part

# further, different models support different elements of the prompt (e.g. some have a system/instruction section and some don't, in which case it's to be included in the user section)

# make Formatter class with methods like `flexible`, `Alpaca` and `ChatML`

import fnmatch

class Formatter:
	# TODO: add `priorMsgs` arg
	def flexible(self, user, system:str=''):
		prompt = ''
		if system != '':
			prompt += system.strip() + '\n'
		prompt += user.strip() + '\n'
		prompt += 'RESPONSE:\n'
		return prompt
	def Alpaca(self, user: str, system:str=''):
		prompt = ''
		if system != '':
			prompt += system.strip() + '\n\n'
		prompt += '### Instruction:\n' + user.strip() + '\n'
		prompt += '### Response:\n'
		return prompt
	def Alpaca_Input(self, user: str, system:str=''):
		prompt = ''
		if system != '':
			prompt += '### Instruction:\n' + system.strip() + '\n\n'
		prompt += '### Input:\n' + user.strip() + '\n'
		prompt += '### Response:\n'
		return prompt
	def ChatML(self, user: str, system:str=''):
		prompt = ''
		if system != '':
			prompt += '<|im_start|>system\n' + system.strip() + '<|im_end|>\n'
		prompt += '<|im_start|>user\n' + user.strip() + '<|im_end|>\n'
		prompt += '<|im_start|>assistant\n'
		return prompt
	def UserAssistant(self, user: str, system:str=''):
		prompt = ''
		if system != '':
			prompt += system.strip() + '\n'
		prompt += 'USER:\n' + user.strip() + '\n'
		prompt += 'ASSISTANT:\n'
		return prompt

	# this one returns a list of messages instead
	# not sure what to do with this exactly
	def OpenAI(self, user: str, system:str=''):
		prompt = []
		if system != '':
			prompt.append({'role': 'system', 'content': system.strip()})
		prompt.append({'role': 'user', 'content': user.strip()})
		return prompt

def parts_to_str(parts):
	s = ''
	for part in parts:
		hasStr = 'str' in part and part['str'] != None
		hasIf = 'if' in part and part['if'] != None
		pre = 'pre' in part and part['pre'] != None
		suf = 'suf' in part and part['suf'] != None
		if hasStr and (not hasIf or part['if']):
			partStr = f"{pre or ''}{part['str']}{suf or ''}"
			s += partStr
	return s

model_formats = {
	'*dolphin-2.2.1-mistral-7b*': 'ChatML',
}
def parts_to_prompt(parts, model) -> str:
	formatter = None
	# is model a path? get just the model name
	if '/' in model:
		model = model.split('/')[-1]
	for model_format in model_formats:
		if fnmatch.fnmatch(model, model_format):
			formatter = staticmethod(getattr(Formatter(), model_formats[model_format]))
			break
	if formatter == None:
		raise Exception(f"Model {model} not supported.")
	user = parts_to_str(parts['user'])
	if 'system' in parts and len(parts['system']) > 0:
		system = parts_to_str(parts['system'])
	else:
		system = ''
	return formatter(user, system)
