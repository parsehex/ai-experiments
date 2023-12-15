from typing import Generator, List
import logging, os, time
from py_api.args import Args
from .llm_base import LLMClient_Base
from llama_cpp import Llama, LlamaGrammar, LlamaCache
import torch

logger = logging.getLogger(__name__)

def LlamaCppConfig(model_path):
	return {
		'model_path': model_path,
		'n_threads': 8,
		'n_gpu_layers': 35,
		'n_ctx': 4096, # TODO: docs say 0 = from model -- does it work?
	}
def LlamaCppCompletionConfig(
		prompt: str,
		max_tokens: int,
		temperature: int,
		top_p: int,
		repetition_penalty: int,
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
		config['grammar'] = LlamaGrammar.from_string(grammar)
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

		if self.model is not None:
			self.unload_model()

		logger.info(f"Loading model {self.model_name}...")
		start = time.time()
		self.model = Llama(**self.config)
		self.model.set_cache(self.cache)
		end = time.time()
		logger.info(f"Loaded model {self.model_name} in {end - start}s")

	def unload_model(self):
		self.model = None
		self.model_name = None
		self.model_abspath = None
		self.config = None
		torch.cuda.empty_cache()
		logger.info("Unloaded model.")

	def complete(
		self,
		prompt: str,
		max_tokens: int,
		temperature: int,
		top_p: int,
		repetition_penalty: int,
		seed: int,
		grammar: str,
		stop: list
	):
		if self.model is None:
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
