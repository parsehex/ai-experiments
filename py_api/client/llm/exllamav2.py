from typing import Generator, List, Union
import logging, os, re, time
from py_api.args import Args
from py_api.utils.llm_models import parse_size_and_quant
from .base import LLMClient_Base
from llama_cpp import Llama, LlamaGrammar, LlamaCache
from exllamav2 import ExLlamaV2, ExLlamaV2Cache, ExLlamaV2Config, ExLlamaV2Tokenizer
from exllamav2.generator import ExLlamaV2StreamingGenerator, ExLlamaV2Sampler
import torch

logger = logging.getLogger('Exllamav2-client')

def Exllamav2CompletionConfig(
		prompt: str,
	):
	config = {
		'prompt': prompt,
	}
	return config

class LLMClient_Exllamav2(LLMClient_Base):
	device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

	def load_model(self, model_name = ''):
		model_name = model_name or Args['llm_model']
		models_dir = Args['llm_models_dir']

		# model_name should be name of directory in models_dir
		# TODO: model name can also start with 'hf:' to download from HuggingFace
		is_dir = os.path.isdir(os.path.join(models_dir, model_name))
		if not is_dir:
			raise Exception(f'Model {model_name} not found in {models_dir}.')
		self.model_abspath = os.path.join(models_dir, model_name)
		self.model_name = model_name

		if self.loaded or self.model is not None:
			self.unload_model()

		if self.config is None:
			cfg = ExLlamaV2Config()
			cfg.model_dir = self.model_abspath
			cfg.prepare()
			self.config = cfg

		logger.info(f'Loading model {self.model_name}...')
		start = time.time()
		self.model = ExLlamaV2(self.config, lazy_load=True)
		self.cache = ExLlamaV2Cache(self.model, lazy=True)
		self.model.load_autosplit(self.cache)

		self.tokenizer = ExLlamaV2Tokenizer(self.config)
		self.generator = ExLlamaV2StreamingGenerator(self.model, self.cache, self.tokenizer)
		self.generator.warmup()

		end = time.time()
		logger.info(f'Loaded model {self.model_name} in {end - start}s')
		self.loaded = True

	def unload_model(self):
		if self.model is None:
			return
		self.model.unload()
		logger.info('Unloaded model.')
		self.model = None
		self.model_name = None
		self.model_abspath = None
		self.cache = None
		self.config = None
		self.tokenizer = None
		self.generator = None
		self.loaded = False
		torch.cuda.empty_cache()

	def generate(
		self,
		prompt,
		max_tokens,
		temperature,
		top_p,
		repetition_penalty,
		seed, # i dont think exllamav2 actually has this implemented
		grammar, # not used
		stop
	):
		if not self.loaded or self.model is None or self.generator is None or self.tokenizer is None or self.cache is None:
			raise Exception('Re-load model.')

		settings = ExLlamaV2Sampler.Settings()
		settings.temperature = temperature
		settings.top_p = top_p
		settings.token_repetition_penalty = repetition_penalty
		settings.disallow_tokens(self.tokenizer, []) # would ban eos token here?

		start = time.time()

		input_ids = self.tokenizer.encode(prompt)
		input_ids.to(self.device)

		self.generator.set_stop_conditions(stop)
		self.generator.begin_stream(input_ids, settings)

		generated_tokens = 0
		while True:
			chunk, eos, _ = self.generator.stream()
			generated_tokens += 1
			if eos or generated_tokens >= max_tokens:
				break
			yield chunk

		end = time.time()
		logger.info(f'Generated text in {end - start}s')

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
			self.load_model()
		result = ''
		for chunk in self.generate(
			prompt,
			max_tokens,
			temperature,
			top_p,
			repetition_penalty,
			seed,
			grammar,
			stop
		):
			result += chunk

		obj = {
			'id': '',
			'object': 'text_completion',
			'created': int(time.time()),
			'model': self.model_name,
			'choices': [{
				'text': result,
				'index': 0,
				'finish_reason': 'length',
			}],
			'usage': {
				'prompt_tokens': 0,
				'completion_tokens': 0,
				'total_tokens': 0,
			}
		}
		return obj
