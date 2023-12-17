from typing import Union
from pydantic import BaseModel, Field
from py_api.models.llm_client import CompletionOptions

class PromptPart(BaseModel):
	use: bool = Field(True, description='Whether to use prompt part.')
	val: str = Field(..., description='Prompt part value.')
	pre: str = Field('', description='Prefix to add to prompt part.')
	suf: str = Field('', description='Suffix to add to prompt part.')

class PromptParts(BaseModel):
	user: list[PromptPart] = Field(..., description='User prompt parts.')
	system: list[PromptPart] = Field([], description='System prompt parts.')

class CompletionRequest(CompletionOptions):
	prompt: str = Field('', description='Prompt to feed to model.')
	parts: PromptParts = Field(None, description='Prompt parts to construct prompt from.')
	prefixResponse: str = Field('', description='Prefix to add to prompt.')
	return_prompt: bool = Field(False, description='Return prompt with response.')

class CompletionUsage(BaseModel):
	prompt_tokens: int = Field(0, description='Number of tokens in prompt.')
	completion_tokens: int = Field(0, description='Number of tokens in completion.')
	total_tokens: int = Field(0, description='Total number of tokens.')

class CompletionChoice(BaseModel):
	text: str = Field(..., description='Completion text.')
	index: int = Field(..., description='Completion index.')
	# logprobs: Union[dict, None] = Field(..., description='Completion logprobs.')
	finish_reason: str = Field(..., description='Completion finish reason (e.g. `stop` or `length`).')

class CompletionResult(BaseModel):
	id: str = Field(..., description='Completion ID.')
	object: str = Field(..., description='Completion object.')
	created: int = Field(..., description='Completion creation timestamp.')
	model: str = Field(..., description='Completion model.')
	choices: list[CompletionChoice] = Field(..., description='Completion choices.')
	usage: CompletionUsage = Field(..., description='Completion usage.')

class CompletionResponse(BaseModel):
	result: CompletionResult = Field(..., description='Completion result.')
	prompt: str = Field('', description='Prompt used to generate result, if passed `return_prompt` was True.')
