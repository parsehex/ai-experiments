from typing import Generator, List, Dict, Union

class LLMClient_Base:
	_instance = None
	cache = None
	config = None
	loaded = False
	model = None
	model_name = None
	model_abspath = None

	@classmethod
	@property
	def instance(cls):
		if not cls._instance:
			cls._instance = cls()
		return cls._instance


	def load_model(self, model_name: str):
		raise NotImplementedError()

	def unload_model(self):
		raise NotImplementedError()

	def generate(
		self,
		prompt: str,
		max_tokens: int,
		temperature: Union[int, float],
		top_p: int,
		repetition_penalty: Union[int, float],
		seed: int,
		grammar: str,
		stop: list
	) -> Generator:
		"""(TODO) Generate text from a prompt. Returns a Generator."""
		raise NotImplementedError()

	def complete(
		self,
		prompt: str,
		max_tokens: int,
		temperature: Union[int, float],
		top_p: int,
		repetition_penalty: Union[int, float],
		seed: int,
		grammar: str,
		stop: list
	) -> str:
		"""Generate text from a prompt. Returns a string."""
		raise NotImplementedError()

	def chat(
		self,
		messages: List[Dict],
		max_tokens: int,
		temperature: int,
		top_p: int,
		repetition_penalty: int,
		seed: int,
		grammar: str,
		stop: list
	):
		raise NotImplementedError()
