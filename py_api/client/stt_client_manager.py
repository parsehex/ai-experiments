from typing import Union
from py_api.client.base_manager import BaseAIManager
from py_api.client.stt.whispercpp import WhisperCppClient
from py_api.models.stt.stt_client import TranscribeOptions, TranscribeResponse

class STTManager(BaseAIManager):
	clients = {
		'whispercpp': WhisperCppClient.instance,
	}

	def load_model(self, model_name: str | None):
		# currently we don't load a model
		pass

	def unload_model(self):
		pass

	def transcribe(self, file_path: str) -> TranscribeResponse:
		client = self.clients['whispercpp']
		return client.transcribe(
			TranscribeOptions.model_validate({'file_path': file_path})
		)
