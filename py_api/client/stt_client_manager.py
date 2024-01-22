from typing import Union
from py_api.client.base_manager import BaseAIManager
from py_api.client.stt import STTClient_WhisperCpp, STTClient_WhisperX
from py_api.models.stt.stt_client import TranscribeOptions, TranscribeResponse

class STTManager(BaseAIManager):
	clients = {
		'whispercpp': STTClient_WhisperCpp.instance,
		'whisperx': STTClient_WhisperX.instance
	}
	model = None  # either whispercpp or whisperx

	def load_model(self, model_name: str | None):
		if self.model:
			self.unload_model()
		if model_name == 'whispercpp':
			self.model = 'whispercpp'
		elif model_name == 'whisperx':
			self.model = 'whisperx'
			self.clients['whisperx'].load_model(model_name)

	def unload_model(self):
		if self.model == 'whispercpp':
			pass
		elif self.model == 'whisperx':
			self.clients['whisperx'].unload_model()
		self.model = None

	def transcribe(
		self,
		file_path: str,
		diarize: bool = False
	) -> TranscribeResponse:
		if not self.model:
			raise Exception('Model not loaded')
		client = self.clients[self.model]
		assert isinstance(
			client, STTClient_WhisperCpp
		) or isinstance(client, STTClient_WhisperX)
		return client.transcribe(
			TranscribeOptions.model_validate({
				'file_path': file_path,
				'diarize': diarize
			})
		)
