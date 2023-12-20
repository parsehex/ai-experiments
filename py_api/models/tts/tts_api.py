from typing import Union
from pydantic import BaseModel, Field
from .tts_client import SpeakOptions, SpeakToFileOptions

class SpeakRequest(SpeakOptions):
	"""Options to generate TTS audio."""
	pass

class SpeakToFileRequest(SpeakToFileOptions):
	"""Options to generate and save TTS audio to file on server."""
	pass
