from typing import Union
from pydantic import BaseModel, Field
from .tts_client import SpeakOptions, SpeakToFileOptions


class GetModelResponse(BaseModel):
	"""Get currently loaded TTS model."""
	model: str = Field(..., description='Model name.')


class LoadModelResponse(BaseModel):
	"""Load TTS model."""
	status: str = Field(...,
	                    description='Model status.',
	                    examples=['Loaded', 'Error'])
	model: str = Field(..., description='Model name.')
	time: float = Field(..., description='Time to load model.')
	error: Union[str, None] = Field(None, description='Error message.')


class UnloadModelResponse(BaseModel):
	"""Unload TTS model."""
	status: str = Field('Unloaded', description='Model status.')
	model: str = Field(..., description='Model name.')
	time: float = Field(..., description='Time to unload model.')


class ListModelsResponse(BaseModel):
	"""List available TTS models."""
	models: list[str] = Field(..., description='Available models.')


class ListVoicesResponse(BaseModel):
	"""List available TTS voices."""
	voices: list[str] = Field(..., description='Available voices.')


class SpeakRequest(SpeakOptions):
	"""Options to generate TTS audio."""
	pass


class SpeakToFileRequest(SpeakToFileOptions):
	"""Options to generate and save TTS audio to file on server."""
	pass
