import logging, os
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from py_api.args import Args
from py_api.client import LLMClient_LlamaCppPython
from py_api.models.llm_api import CompletionRequest, CompletionResponse
from py_api.utils import prompt_format

logger = logging.getLogger(__name__)

# supported extensions
EXTENSIONS = ['.gguf', '.ggml']

def llm_api(app: FastAPI):
	llm = LLMClient_LlamaCppPython.instance

	def modelName():
		return llm.model_name or ''

	@app.post("/llm/v1/complete")
	async def llm_complete(req: CompletionRequest) -> CompletionResponse:
		"""Generate text from a prompt, or an array of PromptParts. Prompt should be in proper format (unless using `parts`), it's fed directly to the model. If both are provided then `prompt` is overwritten by constructing prompt from `parts`."""
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

		result = llm.complete(
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
		return JSONResponse(content={"model_name": llm.model_name})

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
		if model_name is None:
			raise HTTPException(status_code=400, detail="model_name is required")
		llm.load_model(model_name)
		return 'OK'

	@app.get("/llm/v1/model/unload")
	async def unload_model():
		"""Unload currently-loaded model"""
		llm.unload_model()
		return 'OK'
