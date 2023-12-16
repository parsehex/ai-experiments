import torch
torch.cuda.empty_cache()

import argparse, logging, os
import uvicorn, fastapi

from py_api.api.llm_api import llm_api
from py_api.args import Args
from py_api.client import llm as LLM
from py_api.settings import HOST, PORT, LLM_MODELS_DIR, LLM_MODEL
from py_api.utils import prompt_format

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

	totalmem = torch.cuda.get_device_properties(0).total_memory
	totalmem /= 1024**3
	usedmem = torch.cuda.memory_allocated(0)
	usedmem /= 1024**3
	freemem = totalmem - usedmem
	logger.debug(f"Total GPU memory: {totalmem:.2f} GB")
	if freemem < 1:
		raise RuntimeError("Not enough GPU memory to run LLM.")

	model_name = Args['llm_model']
	models_dir = Args['llm_models_dir']
	if model_name is not None:
		fmt = prompt_format.get_model_format(model_name)
		logger.info(f"Detected model prompt format: {fmt}")

	is_exllamav2 = False
	p = os.path.join(models_dir, model_name)
	if os.path.isdir(p):
		if 'gptq' in model_name or 'exl2' in model_name:
			is_exllamav2 = True
		else:
			# not implemented
			raise NotImplementedError()

	if is_exllamav2:
		llm = LLM.LLMClient_Exllamav2.instance
	else:
		llm = LLM.LLMClient_LlamaCppPython.instance
	llm.load_model()

	app = fastapi.FastAPI()
	llm_api(app)

	uvicorn.run(app, host=args.host, port=args.port)
	logger.info(f"API server started on {args.host}:{args.port}.")
