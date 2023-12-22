import { PromptPart } from './llm';

export type GenerateParams = {
	/** Prompt to generate from. Must provide either `prompt` or `parts` */
	prompt?: string;
	/** PromptParts to construct `prompt` from. Must provide either `prompt` or `parts` */
	parts?: {
		user: PromptPart[];
		system?: PromptPart[];
	};
	prefix_response?: string;
	return_prompt?: boolean;
	max_tokens?: number;
	temp?: number;
	top_p?: number;
	typical?: number;
	tfs?: number;
	repetition_penalty?: number;
	repetition_penalty_range?: number;
	top_k?: number;
	mirostat?: boolean;
	mirostat_tau?: number;
	mirostat_eta?: number;
	mirostat_mu?: number;
	grammar?: string;
	seed?: number;
	// not implemented yet
	// custom_token_bans?: string;
	// ban_eos_token?: boolean;
	stop?: string[];
	[key: string]: any;
};

export enum ServerStatus {
	OFF = 'OFF',
	ON_NO_MODEL = 'ON_NO_MODEL',
	ON_MODEL_LOADED = 'ON_MODEL_LOADED',
	LOADING_MODEL = 'LOADING_MODEL',
}

export type ChatParams = {
	user_input: string;
	regenerate?: boolean;
	_continue?: boolean;
};

export type ModelOptions = {
	action: 'load' | 'unload' | 'list' | 'info';
	model?: string;
	args?: Record<string, any>;
};

export type GenerateResponse = {
	id: string;
	object: 'text_completion';
	created: number;
	model: string;
	choices: { index: number; finish_reason: string; text: string }[];
	logprobs: unknown;
};

export type ChatResponse = {
	results: { history: Record<string, any> }[];
};

export type StopStreamResponse = {
	results: string;
};

export type ModelActionResponse = {
	result: any;
};

export interface ModelInfo {
	model: string;
	loader_name: 'llamacpp' | 'exllamav2' | 'transformers' | '';
}
export type ListModelsResponse = {
	models: string[];
};
export type LoadModelResponse = {
	status: 'Loaded' | 'Error';
	model: string;
	loader_name?: 'llamacpp' | 'exllamav2' | 'transformers' | '';
	error?: string;
};
// export interface TokenCountOptions {
// 	prompt: string;
// }

export interface CompletionOptions {
	prompt: string;
	temp?: number;
	max_tokens?: number;
	grammar?: string;
	stop?: string[];
	prefix_response?: string;
	return_prompt?: boolean;
}
