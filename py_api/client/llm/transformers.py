# https://github.com/casper-hansen/AutoAWQ
# recent commit 14hrs ago

from typing import Generator, List, Union
import logging, os, re, time
from py_api.args import Args
from py_api.models.llm.client import CompletionOptions, CompletionOptions_Transformers
from .base import LLMClient_Base
from transformers import AutoModelForCausalLM, AutoTokenizer, TextStreamer, pipeline
import torch

logger = logging.getLogger('Transformers-client')


class LLMClient_Transformers(LLMClient_Base):
	device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
	OPTIONS_MAP = {
	    'temp': 'temperature',
	    'max_tokens': 'max_new_tokens',
	    'typical': 'typical_p',
	    'repeat_pen': 'repetition_penalty',
	}

	def convert_options(
	    self, options: CompletionOptions) -> CompletionOptions_Transformers:
		new_options = self.map_options_from_moodel(options,
		                                           CompletionOptions_Transformers)
		assert isinstance(new_options, CompletionOptions_Transformers)
		return new_options

	def load_model(self, model_name=''):
		model_name = model_name or Args['llm_model']
		models_dir = Args['llm_models_dir']

		is_dir = os.path.isdir(os.path.join(models_dir, model_name))
		if not is_dir:
			raise Exception(f'Model {model_name} not found in {models_dir}.')
		self.model_abspath = os.path.join(models_dir, model_name)
		self.model_name = model_name

		if self.loaded or self.model is not None:
			self.unload_model()

		self.tokenizer = AutoTokenizer.from_pretrained(self.model_abspath)
		if self.config is None:
			cfg = {
			    'model_name_or_path': self.model_abspath,
			    'low_cpu_mem_usage': True,
			    'device_map': self.device,
			}
			self.config = cfg

		logger.debug(f'Loading model {self.model_name}...')
		start = time.time()
		self.model = AutoModelForCausalLM.from_pretrained(
		    self.model_abspath,
		    low_cpu_mem_usage=True,
		    device_map=self.device,
		)

		# self.generator = TextStreamer(
		# 	self.tokenizer, # type: ignore
		# 	skip_prompt=True,
		# 	skip_special_tokens=True
		# )

		end = time.time()
		logger.debug(f'Loaded model {self.model_name} in {end - start}s')
		self.loaded = True

	def unload_model(self):
		if self.model is None:
			return
		self.model = None
		self.model_name = None
		self.model_abspath = None
		self.cache = None
		self.config = None
		self.tokenizer = None
		self.generator = None
		self.loaded = False
		torch.cuda.empty_cache()
		logger.debug('Unloaded model.')

	# def generate(
	# 	self,
	# 	options: CompletionOptions_Transformers
	# ):
	# 	if not self.loaded or self.model is None or self.generator is None or self.tokenizer is None or self.cache is None:
	# 		raise Exception('Re-load model.')

	# 	start = time.time()

	# 	params = options.model_dump()
	# 	tokens = self.tokenizer(params['prompt'], return_tensors='pt').input_ids.to(self.device)

	# 	output = self.model.generate(
	# 		tokens,
	# 		self.generator,
	# 		**params,
	# 	)

	# 	generated_tokens = 0
	# 	while True:
	# 		chunk = self.tokenizer.decode(output[0], skip_special_tokens=True)
	# 		generated_tokens += 1
	# 		if eos or generated_tokens >= options.max_tokens:
	# 			break
	# 		yield chunk

	# 	end = time.time()
	# 	logger.debug(f'Generated text in {end - start}s')

	def complete(self, options: CompletionOptions_Transformers):
		if not self.loaded or self.model is None:
			self.load_model()
		assert isinstance(options, CompletionOptions_Transformers)
		# result = ''
		# tokens = 0
		# for chunk in self.generate(
		# 	options
		# ):
		# 	tokens += len(chunk)
		# 	result += chunk
		opt = options.model_dump()
		del opt['prompt']
		pipe = pipeline('text-generation',
		                model=self.model,
		                tokenizer=self.tokenizer,
		                **opt)

		result = pipe(options.prompt)
		result = result[0]['generated_text']  # type: ignore
		# remove prompt from result
		result = result[len(options.prompt):]

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
