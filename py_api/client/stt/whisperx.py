import os, re, subprocess
import whisperx
from .base import STTClient_Base
from py_api.models.stt.stt_client import TranscribeOptions, TranscribeResponse
from py_api.settings import HF_TOKEN

class STTClient_WhisperX(STTClient_Base):
	# whisper_cpp_path = '/home/user/whisper.cpp'
	device = 'cuda'
	raw_model = None
	align_model = None
	metadata = None
	diarize_model = None

	def load_model(self, model_name: str | None):
		self.raw_model = whisperx.load_model(
			'large-v2',
			device=self.device,
			compute_type='float16',
			language='en'
		)
		model_a, metadata = whisperx.load_align_model(
			language_code='en', device=self.device
		)
		self.align_model = model_a
		self.metadata = metadata
		if HF_TOKEN:
			self.diarize_model = whisperx.DiarizationPipeline(
				use_auth_token=HF_TOKEN, device=self.device
			)

	def unload_model(self):
		self.raw_model = None
		self.align_model = None
		self.metadata = None
		self.diarize_model = None
		import gc
		import torch
		gc.collect()
		torch.cuda.empty_cache()

	def transcribe(
		self, options: TranscribeOptions
	) -> TranscribeResponse:
		file_path = options.file_path
		exists = os.path.exists(file_path)
		if not exists:
			raise Exception('File does not exist')
		assert self.raw_model
		assert self.align_model
		assert self.metadata

		audio = whisperx.load_audio(options.file_path)
		raw_transcript = self.raw_model.transcribe(
			audio,
			batch_size=16,
			language='en'  # adjust batch_size to fit VRAM
		)
		align_transcript = whisperx.align(
			raw_transcript["segments"],
			self.align_model,
			self.metadata,
			audio,
			device=self.device,
			return_char_alignments=False
		)

		# choose transcript to return
		# if diarize, then diarize and return
		# else return align_transcript
		transcript = align_transcript if not options.diarize else None
		if not transcript:
			if not HF_TOKEN:
				raise Exception('HF_TOKEN not set')
			assert self.diarize_model
			diarize_segments = self.diarize_model(audio)
			diarize_transcript = whisperx.assign_word_speakers(
				diarize_segments, align_transcript
			)
			transcript = diarize_transcript

		parts = self.parse(transcript)
		return TranscribeResponse(parts=parts)

	def parse(self, transcript):
		# drop `word_segments`
		# for each segment:
		#   drop `words`
		#   keep `start` / `end` and `text`
		#   keep `speaker` if present
		parts = []
		for segment in transcript['segments']:
			part = {
				'start': segment['start'],
				'end': segment['end'],
				'speech': segment['text']
			}
			if 'speaker' in segment:
				part['speaker'] = segment['speaker']
			parts.append(part)
		return parts
