from py_api.client.stt.whispercpp import WhisperCppClient
from py_api.models.stt.stt_client import TranscribeOptions, TranscribeResponse

class STTManager:
	_instance = None
	clients = {
		'whispercpp': WhisperCppClient.instance,
	}

	@classmethod
	@property
	def instance(cls):
		if not cls._instance:
			cls._instance = cls()
		return cls._instance

	def transcribe(self, file_path: str) -> TranscribeResponse:
		client = self.clients['whispercpp']
		return client.transcribe(TranscribeOptions.model_validate({'file_path': file_path}))
