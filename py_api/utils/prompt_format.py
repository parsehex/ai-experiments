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

import fnmatch, os
from py_api.models.llm_api import PromptPart, PromptParts

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
		"""Alpaca variation with the system prompt as the instructions."""
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

def parts_to_str(parts: list[PromptPart]):
	s = ''
	for part in parts:
		hasStr = part.val != None
		shouldUse = part.use != None and part.use
		hasPre = part.pre != None
		pre = part.pre if hasPre else ''
		hasSuf = part.suf != None
		suf = part.suf if hasSuf else ''
		if hasStr and shouldUse:
			partStr = f'{pre}{part.val}{suf}'
			s += partStr
	return s

model_formats = {
	'*dolphin-2.*-mistral-7b*': 'ChatML',
	'*emerhyst-20b*': 'Alpaca',
	'*luna-ai-llama2*': 'UserAssistant',
	'*mythalion-13b*': 'Alpaca',
	'*mythomax-l2-13b*': 'Alpaca',
	'*openhermes-2.*-mistral-7b*': 'ChatML',
	'*platypus-30b*': 'Alpaca',
}
def get_model_format(model: str) -> str:
	fmt = None
	model = model.lower()
	for model_format in model_formats:
		if fnmatch.fnmatch(model, model_format):
			fmt = model_formats[model_format]
			break
	if fmt == None:
		raise Exception(f'Model {model} not supported.')
	return fmt

def parts_to_prompt(parts: PromptParts, model: str) -> str:
	formatter = None
	# is model a path? get just the model name
	if '/' in model:
		model = os.path.basename(model)
	fmt = get_model_format(model)
	formatter = staticmethod(getattr(Formatter(), fmt))
	user = parts_to_str(parts.user)
	if hasattr(parts, 'system') and len(parts.system) > 0:
		system = parts_to_str(parts.system)
	else:
		system = ''
	return formatter(user, system)
