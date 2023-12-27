from pydantic import BaseModel

class TranscribeOptions(BaseModel):
	"""Options for transcribing audio."""
	file_path: str

class TranscribeChunk(BaseModel):
	"""Chunk of transcription."""
	start: str
	end: str
	speech: str

class TranscribeResponse(BaseModel):
	"""Response for transcribing audio."""
	parts: list[TranscribeChunk] = []
