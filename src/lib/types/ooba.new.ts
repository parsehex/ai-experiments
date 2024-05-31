// types for ooba's openai api
export type ModelInfo = {
	model_name: string | null;
	lora_names: string[];
	'shared.settings': Record<string, any>;
	'shared.args': Record<string, any>;
};

export type GenerateParams = {
	prompt: string;
	/** Default: 200 */
	max_new_tokens?: number;
	/** Default: false */
	auto_max_new_tokens?: boolean;
	/** Default: 0 */
	max_tokens_second?: number;
	/** Default: true */
	do_sample?: boolean;
	/** Default: 0.5 */
	temperature?: number;
	/** Default: 1 */
	top_p?: number;
	/** Default: 1 */
	typical_p?: number;
	/** Default: 0 */
	epsilon_cutoff?: number;
	/** Default: 0 */
	eta_cutoff?: number;
	/** Default: 1 */
	tfs?: number;
	/** Default: 0 */
	top_a?: number;
	/** Default: 1.1 */
	repetition_penalty?: number;
	/** Default: 0 */
	repetition_penalty_range?: number;
	/** Default: 1 */
	encoder_repetition_penalty?: number;
	/** Default: 0 */
	top_k?: number;
	/** Default: 0 */
	min_length?: number;
	/** Default: 0 */
	no_repeat_ngram_size?: number;
	/** Default: 1 */
	num_beams?: number;
	/** Default: 0 */
	penalty_alpha?: number;
	/** Default: 1 */
	length_penalty?: number;
	/** Default: false */
	early_stopping?: boolean;
	/** Default: 0 */
	mirostat_mode?: number;
	/** Default: 5 */
	mirostat_tau?: number;
	/** Default: 0.1 */
	mirostat_eta?: number;
	/** Default: '' */
	grammar_string?: string;
	/** Default: 1 */
	guidance_scale?: number;
	/** Default: '' */
	negative_prompt?: string;
	/** Default: -1 */
	seed?: number;
	/** Default: true */
	add_bos_token?: boolean;
	/** Default: 2048 */
	truncation_length?: number;
	/** Default: ''
	 *
	 * A comma-separated list of Token IDs to prevent being returned by the LLM */
	custom_token_bans?: string;
	/** Default: false */
	ban_eos_token?: boolean;
	/** Default: true */
	skip_special_tokens?: boolean;
	/** Default: [] */
	stopping_strings?: string[];
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
	model_name?: string;
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

export interface NewModelInfo {
	/** Model name */
	id: string;
	object: 'model';
	owned_by: 'user';
	created: 0;
}
export type ListModelsResponse = {
	object: 'list';
	data: NewModelInfo[];
};
export type ModelInfoResponse = {
	result: ModelInfo;
};
export interface TokenCountOptions {
	prompt: string;
}
