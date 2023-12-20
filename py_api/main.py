import torch

torch.cuda.empty_cache()

import argparse, logging, os
import uvicorn, fastapi
from fastapi.middleware.cors import CORSMiddleware

from py_api.api.llm_api import llm_api
from py_api.api.tts_api import tts_api
from py_api.args import Args
from py_api.client import llm_client_manager, tts_client_manager
from py_api.settings import HOST, PORT, LLM_MODELS_DIR, LLM_MODEL, TTS_MODELS_DIR, TTS_MODEL, TTS_OUTPUT_DIR, TTS_VOICES_DIR
from py_api.utils import prompt_format

if __name__ == '__main__':
	parser = argparse.ArgumentParser(description='Starts the API server.')

	# --host | --port
	parser.add_argument('--host',
	                    type=str,
	                    default=HOST,
	                    help='The host to bind to.')
	parser.add_argument('--port',
	                    type=int,
	                    default=PORT,
	                    help='The port to bind to.')

	# --llm-models-dir | --llm-model
	parser.add_argument('--llm-models-dir',
	                    type=str,
	                    default=LLM_MODELS_DIR,
	                    help='The directory to load LLM models from.')
	parser.add_argument('--llm-model',
	                    type=str,
	                    default=LLM_MODEL,
	                    help='The LLM model to load.')

	# --tts-models-dir | --tts-model | --tts-output-dir | --tts-voices-dir
	parser.add_argument('--tts-model',
	                    type=str,
	                    default=TTS_MODEL,
	                    help='The TTS model to load.')
	parser.add_argument('--tts-models-dir',
	                    type=str,
	                    default=TTS_MODELS_DIR,
	                    help='The directory to load TTS models from.')
	parser.add_argument('--tts-output-dir',
	                    type=str,
	                    default=TTS_OUTPUT_DIR,
	                    help='The directory to save TTS output to.')
	parser.add_argument('--tts-voices-dir',
	                    type=str,
	                    default=TTS_VOICES_DIR,
	                    help='The directory to load TTS voices from.')

	# --log-level
	parser.add_argument('--log-level',
	                    type=str,
	                    default='INFO',
	                    help='The log level to use.')

	args = parser.parse_args()
	Args['host'] = args.host
	Args['port'] = args.port
	Args['llm_models_dir'] = args.llm_models_dir
	Args['llm_model'] = args.llm_model
	Args['tts_models_dir'] = args.tts_models_dir
	Args['tts_model'] = args.tts_model
	Args['tts_output_dir'] = args.tts_output_dir
	Args['tts_voices_dir'] = args.tts_voices_dir

	logging.basicConfig(level=args.log_level)
	logger = logging.getLogger(__name__)

	totalmem = torch.cuda.get_device_properties(0).total_memory
	totalmem /= 1024**3
	usedmem = torch.cuda.memory_allocated(0)
	usedmem /= 1024**3
	freemem = totalmem - usedmem
	logger.debug(f'Total GPU memory: {totalmem:.2f} GB')
	if freemem < 1:
		raise RuntimeError('Not enough GPU memory to run LLM.')

	llm_model = Args['llm_model']
	tts_model = Args['tts_model']
	if llm_model is not None:
		fmt = prompt_format.get_model_format(llm_model)
		logger.info(f'Detected model prompt format: {fmt}')

	llmManager = llm_client_manager.LLMManager.instance
	llmManager.load_model(llm_model)
	ttsManager = tts_client_manager.TTSManager.instance
	ttsManager.load_model(tts_model)

	app = fastapi.FastAPI()
	app.add_middleware(
	    CORSMiddleware,
	    allow_origins=[
	        "http://localhost:8085",
	    ],
	    allow_credentials=True,
	    allow_methods=["*"],
	    allow_headers=["*"],
	)
	llm_api(app)
	tts_api(app)

	uvicorn.run(app, host=args.host, port=args.port)
	logger.info(f'API server started on {args.host}:{args.port}.')
