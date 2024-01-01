from typing import Union
from py_api.args import Args
from py_api.client.base_manager import BaseAIManager
from py_api.client.tts.xtts import TTSClient_XTTS
from py_api.models.tts.tts_client import SpeakOptions, SpeakToFileOptions, SpeakResponse, SpeakToFileResponse

class TTSManager(BaseAIManager):
	clients: dict[str, TTSClient_XTTS] = {
		'xtts': TTSClient_XTTS.instance,
		# 'openai': TTSClient_OpenAI.instance, # TODO
	}
	loader: Union[TTSClient_XTTS, None] = None

	def __init__(self):
		self.clients = {
			'xtts': TTSClient_XTTS.instance,
		}
		self.default_model = Args['tts_model']
		# self.models_dir = Args['tts_models_dir']

	def pick_client(self, model_name: str):
		return 'xtts'

	def list_models(self):
		models = ['tts_models/multilingual/multi-dataset/xtts_v2']
		return models

	# def list_voices(self):
	# includes local and external voices

	def speak(self, gen_options: SpeakOptions) -> SpeakResponse:
		if not self.loader:
			self.load_model(None)
			if not self.loader:
				raise Exception('Model not loaded.')
		return self.loader.speak(gen_options)

	def speak_to_file(
		self, gen_options: SpeakToFileOptions
	) -> SpeakToFileResponse:
		if not self.loader:
			self.load_model(None)
			if not self.loader:
				raise Exception('Model not loaded.')
		return self.loader.speak_to_file(gen_options)
