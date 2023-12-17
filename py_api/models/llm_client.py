from typing import Optional, List, Any
from pydantic import BaseModel, Field

class CompletionOptions(BaseModel):
	"""Generic model, to be passed to manager, which will convert to model-specific options."""
	# Common options
	prompt: str = Field(..., description='Prompt to feed to model.')
	temp: float = Field(0.7, description='Temperature for sampling.')
	max_tokens: int = Field(128, description='Maximum number of tokens to generate.')
	top_p: float = Field(0.9, description='Top-p (nucleus) sampling cutoff.')
	min_p: float = Field(0.0, description='Minimum probability for top-p sampling.')
	top_k: int = Field(40, description='Top-k sampling cutoff.')
	typical: float = Field(0.0, description='Typical_p')
	tfs: float = Field(0.0, description='Tail free sampling.')
	repeat_pen: float = Field(1.05, description='Repetition penalty.')
	mirostat: bool = Field(False, description='Whether to use mirostat. Will use appropriate value for current loader.')
	mirostat_tau: float = Field(0.0, description='Mirostat tau.')
	mirostat_eta: float = Field(0.0, description='Mirostat eta.')
	stop: list[str] = Field([], description='Stop strings.')

	# LlamaCppPython options
	frequency_penalty: Optional[float] = Field(None, description='Frequency penalty. LlamaCpp only.')
	presence_penalty: Optional[float] = Field(None, description='Presence penalty. LlamaCpp only.')
	seed: Optional[int] = Field(None, description='Seed. LlamaCpp only.')
	grammar: Optional[str] = Field(None, description='Grammar to use for constrained sampling. LlamaCpp only.')

	# Exllamav2 options
	token_repetition_range: Optional[int] = Field(-1, description='Token repetition range. Exllamav2 only.')
	token_repetition_decay: Optional[float] = Field(0.0, description='Token repetition decay. Exllamav2 only.')
	temperature_last: Optional[bool] = Field(False, description='Whether to use temperature last. Exllamav2 only.')
	mirostat_mu: Optional[Any] = Field(None, description='Mirostat mu. Exllamav2 only.')

class CompletionOptions_LlamaCppPython(BaseModel):
	prompt: str = Field(..., description='Prompt to feed to model.')
	temperature: Optional[float] = Field(0.8, description='Temperature for sampling.')
	max_tokens: Optional[int] = Field(16, description='Maximum number of tokens to generate.')
	top_p: Optional[float] = Field(0.95, description='Top-p (nucleus) sampling cutoff.')
	min_p: Optional[float] = Field(0.05, description='Minimum probability for top-p sampling.')
	typical_p: Optional[float] = Field(1.0, description='Typical_p')
	stop: Optional[list[str]] = Field([], description='Stop strings.')
	frequency_penalty: Optional[float] = Field(0.0, description='Frequency penalty.')
	presence_penalty: Optional[float] = Field(0.0, description='Presence penalty.')
	repeat_penalty: Optional[float] = Field(1.1, description='Repetition penalty.')
	top_k: Optional[int] = Field(40, description='Top-k sampling cutoff.')
	seed: Optional[int] = Field(-1, description='Seed.')
	tfs_z: Optional[float] = Field(1.0, description='Tail free sampling.')
	mirostat_mode: Optional[int] = Field(0, description='Whether to use mirostat.')
	mirostat_tau: Optional[float] = Field(5.0, description='Mirostat tau.')
	mirostat_eta: Optional[float] = Field(0.1, description='Mirostat eta.')
	grammar: Optional[Any] = Field(None, description='Instance of LlamaGrammar.')

class CompletionOptions_Exllamav2(BaseModel):
	prompt: str = Field(..., description='Prompt to feed to model.')
	max_tokens: int = Field(128, description='Maximum number of tokens to generate.')
	token_repetition_penalty: float = Field(1.15, description='Token repetition penalty.')
	token_repetition_range: int = Field(-1, description='Token repetition range.')
	token_repetition_decay: int = Field(0, description='Token repetition decay.')
	temperature: float = Field(0.9, description='Temperature for sampling.')
	top_k: int = Field(40, description='Top-k sampling cutoff.')
	top_p: float = Field(0.9, description='Top-p (nucleus) sampling cutoff.')
	stop: list[str] = Field([], description='Stop strings.')
	min_p: float = Field(0.0, description='Minimum probability for top-p sampling.')
	tfs: float = Field(0.0, description='Tail free sampling.')
	typical: float = Field(0.0, description='Typical_p')
	temperature_last: bool = Field(False, description='Whether to use temperature last.')
	mirostat: bool = Field(False, description='Whether to use mirostat.')
	mirostat_tau: float = Field(1.5, description='Mirostat tau.')
	mirostat_eta: float = Field(0.1, description='Mirostat eta.')
	mirostat_mu: Any = Field(None, description='Mirostat mu.')
