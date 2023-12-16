import torch
torch.cuda.empty_cache()

import argparse, logging
import uvicorn, fastapi

from py_api.api.llm_api import llm_api
from py_api.args import Args
from py_api.client import llm as LLM
from py_api.settings import HOST, PORT, LLM_MODELS_DIR, LLM_MODEL

if __name__ == "__main__":
	parser = argparse.ArgumentParser(description="Starts the API server.")

	# --host | --port
	parser.add_argument("--host", type=str, default=HOST, help="The host to bind to.")
	parser.add_argument("--port", type=int, default=PORT, help="The port to bind to.")

	# --llm-models-dir | --llm-model
	parser.add_argument("--llm-models-dir", type=str, default=LLM_MODELS_DIR, help="The directory to load LLM models from.")
	parser.add_argument("--llm-model", type=str, default=LLM_MODEL, help="The LLM model to load.")

	# --log-level
	parser.add_argument("--log-level", type=str, default="INFO", help="The log level to use.")

	args = parser.parse_args()
	Args['host'] = args.host
	Args['port'] = args.port
	Args['llm_models_dir'] = args.llm_models_dir
	Args['llm_model'] = args.llm_model

	logging.basicConfig(level=args.log_level)
	logger = logging.getLogger(__name__)

	llm = LLM.LLMClient_LlamaCppPython.instance
	llm.load_model()

	app = fastapi.FastAPI()
	llm_api(app)

	uvicorn.run(app, host=args.host, port=args.port)
	logger.info(f"API server started on {args.host}:{args.port}.")
