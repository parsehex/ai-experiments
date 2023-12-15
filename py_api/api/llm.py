from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import logging
from py_api.client import LLMClient_LlamaCppPython
from py_api.utils import prompt_format

logger = logging.getLogger(__name__)

def llm_api(app: FastAPI):
	llm = LLMClient_LlamaCppPython.instance

	@app.post("/llm/v1/complete")
	async def llm_complete(body: dict):
		"""Generate text from a prompt, or an array of PromptParts. Prompt should be in proper format (unless using `parts`), it's fed directly to the model. If both provided then `prompt` is overwritten by constructing prompt from `parts`."""
		prompt = body.get('prompt')
		parts = body.get('parts')
		prefixResponse = body.get('prefixResponse', '') # AKA "suffixPrompt"
		return_prompt = body.get('return_prompt', False)

		max_tokens = body.get('max_tokens', 128)
		temperature = body.get('temperature', 0.7)
		top_p = body.get('top_p', 0.9)
		repetition_penalty = body.get('repetition_penalty', 1.05)
		seed = body.get('seed', -1)
		grammar = body.get('grammar', '')
		stop = body.get('stop', [])

		if prompt is None and parts is None:
			raise HTTPException(status_code=400, detail="Prompt or parts is required.")
		if parts is not None:
			prompt = prompt_format.parts_to_prompt(parts, llm.model_name)
		else:
			# prompt should already be a string but just in case
			prompt = str(prompt)

		if prefixResponse != '':
			prompt = prompt.strip() + '\n' + str(prefixResponse)

		result = llm.complete(
			prompt,
			max_tokens,
			temperature,
			top_p,
			repetition_penalty,
			seed,
			grammar,
			stop
		)

		res: dict = {'result': result}
		if return_prompt:
			res['prompt'] = prompt
		return JSONResponse(res)

	@app.get("/llm/v1/model")
	async def get_model():
			return JSONResponse(content={"model_name": llm.model_name})

	# @app.POST("/llm/v1/load_model")
	# @app.POST("/llm/v1/unload_model")
