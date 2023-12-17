import logging, os, time
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from py_api.args import Args
from py_api.client import llm_client_manager
from py_api.models.llm_api import CompletionRequest, CompletionResponse
from py_api.models.llm_client import CompletionOptions
from py_api.utils import prompt_format
from py_api.utils.llm_models import exllamav2_or_llamacpp

logger = logging.getLogger(__name__)

# supported extensions
EXTENSIONS = ['.gguf', '.ggml']

manager = llm_client_manager.LLMManager.instance
def llm_api(app: FastAPI):
	def modelName():
		if manager.model_name is not None:
			return manager.model_name
		else:
			return 'None'

	@app.post('/llm/v1/complete', response_model=CompletionResponse)
	async def llm_complete(req: CompletionRequest):
		"""Generate text from a prompt, or an array of PromptParts. Prompt should be in proper format (unless using `parts`), it's fed directly to the model. If both are provided then `prompt` is overwritten by constructing prompt from `parts`."""
		global manager
		if manager.model_name is None:
			manager.load_model(None)
			if manager.model_name is None:
				raise HTTPException(status_code=500, detail='Model not loaded.')

		prompt = req.prompt
		parts = req.parts
		prefix_response = req.prefix_response # AKA "suffix_prompt"
		return_prompt = req.return_prompt

		if prompt is None and parts is None:
			raise HTTPException(status_code=400, detail='Prompt or parts is required.')
		if parts is not None:
			prompt = prompt_format.parts_to_prompt(parts, modelName())
		else:
			# prompt should already be a string but just in case
			prompt = str(prompt)

		if prefix_response != '':
			prompt = prompt.strip() + '\n' + str(prefix_response)

		req.prompt = prompt
		options = CompletionOptions.model_validate(req.model_dump())

		result = manager.complete(options)

		res: dict = {'result': result}
		if return_prompt:
			res['prompt'] = prompt
		return CompletionResponse(**res)

	@app.get('/llm/v1/model')
	async def get_model():
		"""Get currently-loaded model_name"""
		loader = exllamav2_or_llamacpp(modelName())
		return JSONResponse(content={'model_name': modelName(), 'loader': loader})

	@app.get('/llm/v1/list-models')
	async def list_models():
		"""Get list of models (using relative filenames) in llm_models_dir"""
		models_dir = Args['llm_models_dir']
		model_names = []
		for filename in os.listdir(models_dir):
			path = os.path.join(models_dir, filename)
			if os.path.isfile(path) and os.path.splitext(filename)[1] in EXTENSIONS:
				model_names.append(filename)
			if os.path.isdir(path):
				for subfilename in os.listdir(os.path.join(models_dir, filename)):
					path = os.path.join(models_dir, filename, subfilename)
					if os.path.isfile(path) and os.path.splitext(subfilename)[1] in EXTENSIONS:
						model_names.append(os.path.join(filename, subfilename))
		return JSONResponse(content={'models': model_names})

	@app.get('/llm/v1/model/load')
	async def load_model(model_name: str):
		"""Load a model by filename from llm_models_dir"""
		global manager
		# TODO: instead of model name, accept 'features' dict:
		#   grammar (bool): model supports grammar
		#   model_type ('instruct' or 'chat'): the preferred model type
		#   cfg (bool): model supports cfg sampler
		#   ctx (int)? (maybe not): preferred n_ctx, probably not trivial (e.g. a bigger model at same ctx might not fit in vram/etc)
		if model_name is None:
			raise HTTPException(status_code=400, detail='model_name is required')

		start = time.time()
		if manager.model_name is not None:
			if manager.model_name == model_name:
				return JSONResponse(content={'status': 'Loaded', 'model_name': modelName(), 'time': time.time() - start})
			manager.unload_model()

		logger.debug(model_name)
		manager.load_model(model_name)

		return JSONResponse(content={'status': 'Loaded', 'model_name': modelName(), 'time': time.time() - start})

	@app.get('/llm/v1/model/unload')
	async def unload_model():
		"""Unload currently-loaded model"""
		global manager
		start = time.time()
		if manager.model_name is None:
			return JSONResponse(content={'status': 'Unloaded', 'model_name': modelName(), 'time': time.time() - start})
		manager.unload_model()
		return JSONResponse(content={'status': 'Unloaded', 'model_name': modelName(), 'time': time.time() - start})
