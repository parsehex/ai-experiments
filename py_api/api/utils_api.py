# TODO
# convert audio to wav
#   maybe /convert-audio?
#   pass format (if wav then pick some defaults like 16000 hz, 16 bit, mono)
#   allow options for trimming, etc.
# remove noise from audio (with facebook denoiser)

import logging, os, time
import subprocess as sp
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from py_api.args import Args
from py_api.client.stt_client_manager import STTManager
from py_api.models.stt.stt_client import TranscribeResponse
from py_api.models.utils_api import GetVRAMResponse
from py_api.utils import audio

logger = logging.getLogger(__name__)
manager = STTManager.instance

def utils_api(app: FastAPI):
	@app.get('/utils/v1/vram', tags=['utils'])
	async def get_vram() -> GetVRAMResponse:
		"""
		Get VRAM usage.
		"""
		command = "nvidia-smi --query-gpu=gpu_name,memory.free,memory.total --format=csv"
		memory_info = sp.check_output(
			command.split()
		).decode('ascii').split('\n')[:-1][1:]
		memory_values = memory_info[0].split(', ')
		gpu_name = memory_values[0]
		mem_free = int(memory_values[1].split()[0])
		mem_total = int(memory_values[2].split()[0])
		mem_used = mem_total - mem_free

		return GetVRAMResponse(
			gpu_name=gpu_name,
			used=mem_used / 1024,
			total=mem_total / 1024,
			free=mem_free / 1024
		)
