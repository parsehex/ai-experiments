from typing import Union
from py_api.args import Args
from py_api.client.llm import LLMClient_LlamaCppPython, LLMClient_Exllamav2, LLMClient_Transformers
from py_api.utils.llm_models import detect_loader_name
from py_api.models.llm.client import CompletionOptions, CompletionOptions_LlamaCppPython, CompletionOptions_Exllamav2, CompletionOptions_Transformers


class LLMManager:
	_instance = None
	clients: dict[str, Union[LLMClient_LlamaCppPython, LLMClient_Exllamav2,
	                         LLMClient_Transformers]] = {
	                             'llamacpp': LLMClient_LlamaCppPython.instance,
	                             'exllamav2': LLMClient_Exllamav2.instance,
	                             'transformers': LLMClient_Transformers.instance,
	                         }
	model_name: Union[str, None] = None
	loader: Union[LLMClient_LlamaCppPython, LLMClient_Exllamav2,
	              LLMClient_Transformers, None] = None
	loader_name: Union[str, None] = None

	def get_loader_model(self):
		if self.loader == LLMClient_LlamaCppPython.instance:
			return CompletionOptions_LlamaCppPython
		if self.loader == LLMClient_Exllamav2.instance:
			return CompletionOptions_Exllamav2
		if self.loader == LLMClient_Transformers.instance:
			return CompletionOptions_Transformers

	@classmethod
	@property
	def instance(cls):
		if not cls._instance:
			cls._instance = cls()
		return cls._instance

	def __init__(self):
		self.clients = {
		    'llamacpp': LLMClient_LlamaCppPython.instance,
		    'exllamav2': LLMClient_Exllamav2.instance,
		    'transformers': LLMClient_Transformers.instance,
		}

	def load_model(self, model_name: Union[str, None]):
		if model_name is None or model_name == '':
			model_name = Args['llm_model']
		if model_name == self.model_name:
			return
		client = detect_loader_name(model_name)
		client_instance = self.clients[client]
		self.loader_name = client
		self.loader = client_instance
		self.loader.load_model(model_name)
		self.model_name = model_name

	def unload_model(self):
		if self.loader:
			self.loader.unload_model()
		self.loader = None
		self.loader_name = None
		self.model_name = None

	def generate(self, gen_options: CompletionOptions):
		if not self.loader:
			self.load_model(None)
			if not self.loader:
				raise Exception('Model not loaded.')
		options = self.loader.convert_options(gen_options)
		loader_model = self.get_loader_model()
		assert loader_model is not None
		assert isinstance(options, loader_model)
		return self.loader.generate(options)  # type: ignore

	def complete(self, gen_options: CompletionOptions):
		if not self.loader:
			self.load_model(None)
			if not self.loader:
				raise Exception('Model not loaded.')
		options = self.loader.convert_options(gen_options)
		loader_model = self.get_loader_model()
		assert loader_model is not None
		assert isinstance(options, loader_model)
		return self.loader.complete(options)  # type: ignore
