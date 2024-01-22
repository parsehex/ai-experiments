from pydantic import BaseModel

class TranscribeOptions(BaseModel):
	"""Options for transcribing audio."""
	file_path: str
	diarize: bool = False

class TranscribeChunk(BaseModel):
	"""Chunk of transcription."""
	start: float
	end: float
	speech: str
	speaker: str = ''

class TranscribeResponse(BaseModel):
	"""Response for transcribing audio."""
	parts: list[TranscribeChunk] = []
