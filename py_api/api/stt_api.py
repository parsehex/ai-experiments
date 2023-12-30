import logging
import os
import time
from fastapi import FastAPI, HTTPException, UploadFile, File
from py_api.args import Args
from py_api.client.stt_client_manager import STTManager
from py_api.models.stt.stt_client import TranscribeResponse
from py_api.utils import audio

logger = logging.getLogger(__name__)
manager = STTManager.instance

def stt_api(app: FastAPI):
	def convert_audio_to_text(
		file_path: str
	) -> TranscribeResponse:
		start = time.time()
		try:
			response = manager.transcribe(file_path)
		except Exception as e:
			raise RuntimeError(f"Error in transcription: {e}")
		end = time.time()
		print(f"Time taken: {end - start}")
		return response

	@app.post('/stt/v1/transcribe', tags=['stt'])
	async def stt_convert(
		file: UploadFile = File(None)
	) -> TranscribeResponse:
		"""
		Convert speech to text.
		"""
		if file.filename is None or file.filename == '':
			raise HTTPException(
				status_code=400, detail="No file provided"
			)
		file_path = os.path.join(
			Args['stt_input_dir'], file.filename
		)
		with open(file_path, 'wb') as f:
			f.write(file.file.read())

		if not file.content_type == 'audio/wav':
			file_path = audio.convert_to_wav(file_path)
		try:
			return convert_audio_to_text(file_path)
		except Exception as e:
			logger.error(f"Error in STT conversion: {e}")
			raise HTTPException(status_code=500, detail=str(e))
