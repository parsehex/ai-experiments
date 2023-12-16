import logging, os
from typing import Union
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from py_api.args import Args
from py_api.client import llm as LLM
from py_api.models.llm import CompletionRequest, CompletionResponse
from py_api.utils import prompt_format

logger = logging.getLogger(__name__)

# supported extensions
EXTENSIONS = ['.gguf', '.ggml']

model: Union[LLM.LLMClient_Exllamav2, LLM.LLMClient_LlamaCppPython, None] = None
def llm_api(app: FastAPI):
	llamacpp = LLM.LLMClient_LlamaCppPython.instance
	exllamav2 = LLM.LLMClient_Exllamav2.instance

	def modelName():
		if model is not None and model.model_name is not None:
			return model.model_name
		else:
			return 'None'

	def exllamav2_or_llamacpp(model_name: str):
		is_exllamav2 = False
		models_dir = Args['llm_models_dir']
		p = os.path.join(models_dir, model_name)
		print(p)
		if os.path.isdir(p):
			print('is dir')
			if 'gptq' in model_name or 'exl2' in model_name:
				is_exllamav2 = True
		if is_exllamav2 == True:
			return 'exllamav2'
		else:
			return 'llamacpp'

	def pick_from_name(model_name = ''):
		name = model_name or Args['llm_model']
		if exllamav2_or_llamacpp(name) == 'exllamav2':
			print('exllamav2')
			return exllamav2
		else:
			print('llamacpp')
			return llamacpp

	@app.post("/llm/v1/complete")
	async def llm_complete(req: CompletionRequest) -> CompletionResponse:
		"""Generate text from a prompt, or an array of PromptParts. Prompt should be in proper format (unless using `parts`), it's fed directly to the model. If both are provided then `prompt` is overwritten by constructing prompt from `parts`."""
		global model
		if model is None:
			pick_from_name()
			if model is None:
				raise HTTPException(status_code=500, detail="Model not loaded.")

		prompt = req.prompt
		parts = req.parts
		prefixResponse = req.prefixResponse # AKA "suffixPrompt"
		return_prompt = req.return_prompt

		if prompt is None and parts is None:
			raise HTTPException(status_code=400, detail="Prompt or parts is required.")
		if parts is not None:
			prompt = prompt_format.parts_to_prompt(parts, modelName())
		else:
			# prompt should already be a string but just in case
			prompt = str(prompt)

		if prefixResponse != '':
			prompt = prompt.strip() + '\n' + str(prefixResponse)

		result = model.complete(
			prompt,
			req.max_tokens,
			req.temperature,
			req.top_p,
			req.repetition_penalty,
			req.seed,
			req.grammar,
			req.stop
		)

		res: dict = {'result': result}
		if return_prompt:
			res['prompt'] = prompt
		return CompletionResponse(**res)

	@app.get("/llm/v1/model")
	async def get_model():
		"""Get currently-loaded model_name"""
		return JSONResponse(content={"model_name": modelName()})

	@app.get("/llm/v1/list-models")
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
		return JSONResponse(content={"models": model_names})

	@app.get("/llm/v1/model/load")
	async def load_model(model_name: str):
		"""Load a model by filename from llm_models_dir"""
		global model
		# TODO: instead of model name, accept 'features' dict:
		#   grammar (bool): model supports grammar
		#   model_type ('instruct' or 'chat'): the preferred model type
		#   cfg (bool): model supports cfg sampler
		#   ctx (int)? (maybe not): preferred n_ctx, probably not trivial (e.g. a bigger model at same ctx might not fit in vram/etc)
		if model_name is None:
			raise HTTPException(status_code=400, detail="model_name is required")

		if model is not None:
			if model.model_name == model_name:
				return 'OK'
			model.unload_model()

		print(model_name)
		model = pick_from_name(model_name)
		if model is None:
			raise HTTPException(status_code=500, detail="Model cannot be loaded.")
		model.load_model(model_name)

		return 'OK'

	@app.get("/llm/v1/model/unload")
	async def unload_model():
		"""Unload currently-loaded model"""
		if model is None:
			return 'OK'
		model.unload_model()
		return 'OK'
