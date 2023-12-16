from typing import Generator, List, Union
import logging, os, re, time
from py_api.args import Args
from .llm_base import LLMClient_Base
from llama_cpp import Llama, LlamaGrammar, LlamaCache
import torch

logger = logging.getLogger(__name__)

def LlamaCppConfig(model_path):
	model_file_name = os.path.basename(model_path)
	# figure out the model size (examples: 7b, 13b, 30b, or others)
	# also get the quant (e.g. "Q5_K_M")
	size = ''
	quant = ''
	# match a period or hyphen followed by a number
	match = re.search(r'(\.|-)(\d+)b(\.|-)', model_file_name.lower())
	if match:
		size = match.group(2)
	# match a period followed by "q" and a number, with optional groups of "_[a-z0-9]" after
	match = re.search(r'\.(q\d(_[a-z0-9])+)', model_file_name.lower())
	if match:
		quant = match.group(1)

	if size == '':
		print(f"WARNING: Could not determine model size from model name {model_file_name}.")
	if quant == '':
		print(f"WARNING: Could not determine quantization from model name {model_file_name}.")
	if size != '' and quant != '':
		print(f"Model Size: {size} | Quant: {quant}")
	return {
		'model_path': model_path,
		'n_threads': 8,
		'n_gpu_layers': 35, # TODO calc from size and quant
		'n_ctx': 4096, # TODO: docs say 0 = from model -- does it work?
		'verbose': False, # setting LLM_VERBOSE ?
	}
def LlamaCppCompletionConfig(
		prompt: str,
		max_tokens: int,
		temperature: Union[int, float],
		top_p: int,
		repetition_penalty: Union[int, float],
		seed: int,
		grammar: str,
		stop: list
	):
	config = {
		'prompt': prompt,
		'max_tokens': max_tokens,
		'temperature': temperature,
		'top_p': top_p,
		'repeat_penalty': repetition_penalty,
		'seed': seed,
		'stop': stop
	}
	if grammar != '' and grammar != None:
		# TODO: LlamaGrammar.from_json_schema ???
		# NOTE: from_string seems to fix grammar (like using "+" which leads to issues (i guess because recursion))
		config['grammar'] = LlamaGrammar.from_string(grammar, False)
	return config

class LLMClient_LlamaCppPython(LLMClient_Base):
	def load_model(self, model_name = Args['llm_model']):
		model_name = Args['llm_model']
		models_dir = Args['llm_models_dir']

		# model_name should be name of file or directory in models_dir
		# TODO: model name can also start with "hf:" to download from HuggingFace
		is_dir = os.path.isdir(os.path.join(models_dir, model_name))
		is_file = os.path.isfile(os.path.join(models_dir, model_name))
		if not is_dir and not is_file:
			raise Exception(f"Model {model_name} not found in {models_dir}.")
		self.model_abspath = os.path.join(models_dir, model_name)
		self.model_name = model_name
		self.cache = LlamaCache()
		self.config = LlamaCppConfig(self.model_abspath)

		if self.loaded or self.model is not None:
			self.unload_model()

		logger.info(f"Loading model {self.model_name}...")
		start = time.time()
		self.model = Llama(**self.config)
		self.model.set_cache(self.cache)
		end = time.time()
		logger.info(f"Loaded model {self.model_name} in {end - start}s")
		self.loaded = True

	def unload_model(self):
		torch.cuda.empty_cache()
		logger.info("Unloaded model.")
		self.model = None
		self.model_name = None
		self.model_abspath = None
		self.config = None
		self.loaded = False

	def complete(
		self,
		prompt,
		max_tokens,
		temperature,
		top_p,
		repetition_penalty,
		seed,
		grammar,
		stop
	):
		if not self.loaded or self.model is None:
			raise Exception("No model loaded.")
		config = LlamaCppCompletionConfig(
			prompt,
			max_tokens,
			temperature,
			top_p,
			repetition_penalty,
			seed,
			grammar,
			stop
		)
		start = time.time()
		result = self.model.create_completion(**config)
		end = time.time()
		logger.info(f"Generated text in {end - start}s")
		return result
