import logging, os, time
from fastapi import FastAPI, HTTPException, Path, WebSocket
from fastapi.responses import JSONResponse
from huggingface_hub import snapshot_download
from py_api.args import Args
from py_api.client import llm_client_manager
from py_api.models.llm_api import CompletionRequest, CompletionResponse, DownloadModelRequest
from py_api.models.llm_client import CompletionOptions
from py_api.utils import prompt_format
from py_api.utils.llm_models import detect_loader_name

logger = logging.getLogger(__name__)

# supported extensions
EXTENSIONS = ['.gguf', '.ggml', '.safetensor']

manager = llm_client_manager.LLMManager.instance
def llm_api(app: FastAPI):
	def modelName():
		if manager.model_name is not None:
			return manager.model_name
		else:
			return 'None'
	def get_model():
		return {
			'model_name': modelName(),
			'loader_name': detect_loader_name(modelName())
		}
	def load_model(model_name: str):
		# TODO: instead of model name, accept 'features' dict:
		#   grammar (bool): model supports grammar
		#   model_type ('instruct' or 'chat'): the preferred model type
		#   cfg (bool): model supports cfg sampler
		#   ctx (int)? (maybe not): preferred n_ctx, probably not trivial (e.g. a bigger model at same ctx might not fit in vram/etc)
		start = time.time()
		if manager.model_name is not None:
			if manager.model_name == model_name: # already loaded
				return {'status': 'Loaded', 'model_name': modelName(), 'loader_name': manager.loader_name, 'time': time.time() - start}
			manager.unload_model()
		logger.debug(model_name)
		try:
			manager.load_model(model_name)
		except Exception as e:
			return {'status': 'Error', 'model_name': modelName(), 'time': time.time() - start, 'error': str(e)}
		return {'status': 'Loaded', 'model_name': modelName(), 'loader_name': manager.loader_name, 'time': time.time() - start}
	def unload_model():
		start = time.time()
		if manager.model_name is None:
			return {'status': 'Unloaded', 'model_name': modelName(), 'time': time.time() - start}
		manager.unload_model()
		return {'status': 'Unloaded', 'model_name': modelName(), 'time': time.time() - start}
	def list_models():
		models_dir = Args['llm_models_dir']
		model_names = []
		for filename in os.listdir(models_dir):
			path = os.path.join(models_dir, filename)
			if os.path.isfile(path) and os.path.splitext(filename)[1] in EXTENSIONS:
				model_names.append(filename)
			if os.path.isdir(path):
				f = filename.lower()
				if 'awq' in f or 'gptq' in f or 'exl2' in f:
					model_names.append(filename)
					continue
				for subfilename in os.listdir(os.path.join(models_dir, filename)):
					path = os.path.join(models_dir, filename, subfilename)
					if os.path.isfile(path) and os.path.splitext(subfilename)[1] in EXTENSIONS:
						model_names.append(os.path.join(filename, subfilename))
		return {'models': model_names}
	def download_model(model_name: str):
		# TODO support links to e.g. *.gguf files (download them to llm_models_dir)
		model = None
		branch = 'main'
		is_right_format = False
		# check that model name is format like 'username/model_name[:branch]'
		if '/' in model_name:
			split = model_name.split('/')
			model = split[1]
			if ':' in model:
				split = model.split(':')
				model = split[0]
				branch = split[1]
			is_right_format = True
		if not is_right_format:
			raise Exception('model_name must be in format like "username/model_name[:branch]"')
		dir_name = model_name.replace('/', '_')
		dir_name = dir_name.replace(':', '--')
		start = time.time()
		try:
			snapshot_download(repo_id=model_name, revision=branch, cache_dir=Args['llm_models_dir'])
		except Exception as e:
			return {'status': 'Error', 'model_name': dir_name, 'time': time.time() - start, 'error': str(e)}
		return {'status': 'Downloaded', 'model_name': dir_name, 'time': time.time() - start}
	def complete(req: CompletionRequest):
		prompt = req.prompt
		parts = req.parts
		prefix_response = req.prefix_response
		return_prompt = req.return_prompt
		if prompt is None and parts is None:
			raise Exception('Prompt or parts is required.')
		if parts is not None:
			try:
				prompt = prompt_format.parts_to_prompt(parts, modelName(), prefix_response)
			except Exception as e:
				raise Exception('Internal server error: Unknown model when detecting format: ' + modelName())
		else:
			prompt = str(prompt)
		req.prompt = prompt
		options = CompletionOptions.model_validate(req.model_dump())
		result = manager.complete(options)
		res: dict = {'result': result}
		if return_prompt:
			res['prompt'] = prompt
		return CompletionResponse(**res)

	@app.websocket('/llm/v1/ws')
	async def llm_ws(websocket: WebSocket):
		await websocket.accept()

		await websocket.send_json({'type': 'list_models', 'data': list_models()})
		await websocket.send_json({'type': 'get_model', 'data': get_model()})
		while True:
			try:
				data = await websocket.receive_json()
			except Exception as e:
				logger.error(e)
				await websocket.close()
				break
			if data['type'] == 'complete':
				req = CompletionRequest(**data['data'])
				try:
					res = complete(req).model_dump(mode='json')
				except Exception as e:
					res = {'error': str(e)}
				await websocket.send_json(res)
			elif data['type'] == 'load_model':
				req = data['data']
				try:
					res = load_model(req.model_name)
				except Exception as e:
					res = {'error': str(e)}
				await websocket.send_json({'type': 'load_model', 'data': res})
			elif data['type'] == 'unload_model':
				await websocket.send_json({'type': 'unload_model', 'data': unload_model()})
			elif data['type'] == 'get_model':
				await websocket.send_json({'type': 'get_model', 'data': get_model()})
			elif data['type'] == 'list_models':
				await websocket.send_json({'type': 'list_models', 'data': list_models()})
			elif data['type'] == 'download_model':
				req = DownloadModelRequest(**data['data'])
				try:
					res = download_model(req.model)
				except Exception as e:
					res = {'error': str(e)}
				await websocket.send_json({'type': 'download_model', 'data': res})

	@app.post('/llm/v1/complete', response_model=CompletionResponse)
	async def llm_complete(req: CompletionRequest):
		"""Generate text from a prompt, or an array of PromptParts. Prompt should be in proper format (unless using `parts`), it's fed directly to the model. If both are provided then `prompt` is overwritten by constructing prompt from `parts`."""
		global manager
		if manager.model_name is None:
			raise HTTPException(status_code=500, detail='Model not loaded.')
		if req.prompt is None and req.parts is None:
			raise HTTPException(status_code=400, detail='Prompt or parts is required.')
		return complete(req)

	@app.get('/llm/v1/model')
	async def llm_get_model():
		"""Get currently-loaded model_name"""
		return JSONResponse(content=get_model())

	@app.get('/llm/v1/list-models')
	async def llm_list_models():
		"""Get list of models (using relative filenames) in llm_models_dir"""
		return JSONResponse(content=list_models())

	@app.get('/llm/v1/model/load')
	async def llm_load_model(model_name: str):
		"""Load a model by filename from llm_models_dir"""
		return JSONResponse(content=load_model(model_name))

	@app.get('/llm/v1/model/unload')
	async def llm_unload_model():
		"""Unload currently-loaded model"""
		return JSONResponse(content=unload_model())

	@app.post('/llm/v1/download-model')
	async def llm_download_model(body: DownloadModelRequest):
		"""Download a model from the HuggingFace Hub"""
		return JSONResponse(content=download_model(body.model))
