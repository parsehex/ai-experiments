export type ModelInfo = {
	model_name: string | null;
	lora_names: string[];
	'shared.settings': Record<string, any>;
	'shared.args': Record<string, any>;
};

/*
generate_params = {
'max_new_tokens': int(body.get('max_new_tokens', body.get('max_length', 200))),
'auto_max_new_tokens': bool(body.get('auto_max_new_tokens', False)),
'max_tokens_second': int(body.get('max_tokens_second', 0)),
'do_sample': bool(body.get('do_sample', True)),
'temperature': float(body.get('temperature', 0.5)),
'top_p': float(body.get('top_p', 1)),
'typical_p': float(body.get('typical_p', body.get('typical', 1))),
'epsilon_cutoff': float(body.get('epsilon_cutoff', 0)),
'eta_cutoff': float(body.get('eta_cutoff', 0)),
'tfs': float(body.get('tfs', 1)),
'top_a': float(body.get('top_a', 0)),
'repetition_penalty': float(body.get('repetition_penalty', body.get('rep_pen', 1.1))),
'repetition_penalty_range': int(body.get('repetition_penalty_range', 0)),
'encoder_repetition_penalty': float(body.get('encoder_repetition_penalty', 1.0)),
'top_k': int(body.get('top_k', 0)),
'min_length': int(body.get('min_length', 0)),
'no_repeat_ngram_size': int(body.get('no_repeat_ngram_size', 0)),
'num_beams': int(body.get('num_beams', 1)),
'penalty_alpha': float(body.get('penalty_alpha', 0)),
'length_penalty': float(body.get('length_penalty', 1)),
'early_stopping': bool(body.get('early_stopping', False)),
'mirostat_mode': int(body.get('mirostat_mode', 0)),
'mirostat_tau': float(body.get('mirostat_tau', 5)),
'mirostat_eta': float(body.get('mirostat_eta', 0.1)),
'grammar_string': str(body.get('grammar_string', '')),
'guidance_scale': float(body.get('guidance_scale', 1)),
'negative_prompt': str(body.get('negative_prompt', '')),
'seed': int(body.get('seed', -1)),
'add_bos_token': bool(body.get('add_bos_token', True)),
'truncation_length': int(body.get('truncation_length', body.get('max_context_length', 2048))),
'custom_token_bans': str(body.get('custom_token_bans', '')),
'ban_eos_token': bool(body.get('ban_eos_token', False)),
'skip_special_tokens': bool(body.get('skip_special_tokens', True)),
'custom_stopping_strings': '',  # leave this blank
'stopping_strings': body.get('stopping_strings', []),
}
*/

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
	/** Default: '' */
	custom_token_bans?: string;
	/** Default: false */
	ban_eos_token?: boolean;
	/** Default: true */
	skip_special_tokens?: boolean;
	/** Default: [] */
	stopping_strings?: string[];
	[key: string]: any;
};

export type ChatParams = {
	user_input: string;
	regenerate?: boolean;
	_continue?: boolean;
	// ... other chat-specific parameters ...
};

export type ModelOptions = {
	action: 'load' | 'unload' | 'list' | 'info';
	model_name?: string;
	args?: Record<string, any>;
};

export type GenerateResponse = {
	results: { text: string }[];
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

export type ListModelsResponse = {
	result: string[];
};
export type ModelInfoResponse = {
	result: ModelInfo;
};
export interface TokenCountOptions {
	prompt: string;
}

export enum ServerStatus {
	OFF = 'OFF',
	ON_NO_MODEL = 'ON_NO_MODEL',
	ON_MODEL_LOADED = 'ON_MODEL_LOADED',
	LOADING_MODEL = 'LOADING_MODEL',
}
