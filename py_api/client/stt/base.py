from py_api.models.stt.stt_client import TranscribeOptions, TranscribeResponse

class STTClient_Base:
	_instance = None

	@classmethod
	@property
	def instance(cls):
		if not cls._instance:
			cls._instance = cls()
		return cls._instance

	def load_model(self, model_name: str | None):
		raise NotImplementedError()

	def transcribe(
		self, options: TranscribeOptions
	) -> TranscribeResponse:
		raise NotImplementedError()
