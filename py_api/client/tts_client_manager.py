from typing import Union
from py_api.args import Args
from py_api.client.tts.xtts import XTTSClient
from py_api.models.tts.tts_client import SpeakOptions, SpeakToFileOptions, SpeakResponse, SpeakToFileResponse

class TTSManager:
	_instance = None
	clients: dict[str, XTTSClient] = {
		'xtts': XTTSClient.instance,
	}
	model_name: Union[str, None] = None
	loader: Union[XTTSClient, None] = None
	loader_name: Union[str, None] = None

	@classmethod
	@property
	def instance(cls):
		if not cls._instance:
			cls._instance = cls()
		return cls._instance

	def __init__(self):
		self.clients = {
			'xtts': XTTSClient.instance,
		}

	def load_model(self, model_name: Union[str, None]):
		if model_name is None or model_name == '':
			model_name = Args['tts_model']
		if model_name == self.model_name:
			return
		client = 'xtts'
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
