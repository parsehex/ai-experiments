import { RawMessage } from '../types/llm';

type OpenAIRoleType = 'system' | 'user' | 'assistant';
interface OpenAIChatCompletionParams {
	prompt: RawMessage<OpenAIRoleType>[];
	api_key: string;
	/** Default: 1 */
	temperature?: number;
	max_tokens?: number;
	/** Number of completions to generate. */
	n?: number;
	/** Specify the format that the output should be. When using JSON mode, you **must** also instruct the model to produce JSON yourself via a system or user message, otherwise it may get stuck outputting in a loop. */
	type?: 'text' | 'json_object';
	seed?: number;
	/** Up to 4 sequences where the API will stop generating further tokens. */
	stop?: string | string[];
	stream?: boolean;
	/** Default: 1 */
	top_p?: number;
	// tools?: any[];
	// tool_choice?: string;
}
interface OpenAIChatCompletionResponse {
	id: string;
	object: 'chat.completion';
	created: number;
	model: string;
	system_fingerprint: string;
	choices: {
		index: number;
		message: RawMessage<OpenAIRoleType>;
		/** E.g. "stop" or "length" */
		finish_reason: string;
	}[];
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

interface OpenAIModel {
	id: string;
	object: 'model';
	created: number;
	owned_by: string;
}
type OpenAIListModelsResponse = {
	object: 'list';
	data: OpenAIModel[];
};

// get models https://api.openai.com/v1/models
// api expects Authorization header with key

export async function generateText(params: OpenAIChatCompletionParams) {
	const url = 'https://api.openai.com/v1/chat/completions';
	const { api_key } = params;
	// @ts-ignore
	delete params.api_key;
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${api_key}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(params),
	});
	const json = await response.json();
	return json as OpenAIChatCompletionResponse;
}

export async function listModels(apiKey: string) {
	const url = 'https://api.openai.com/v1/models';
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});
	const json: OpenAIListModelsResponse = await response.json();
	return json.data;
}

export async function countTokens(str: string): Promise<number> {
	const body = JSON.stringify({ text: str });
	const res = await fetch('/api/tokens/count', {
		method: 'POST',
		body,
	});
	const json = await res.json();
	return json.length;
}
export async function encodeTokens(str: string): Promise<number[]> {
	const body = JSON.stringify({ text: str });
	const res = await fetch('/api/tokens/encode', {
		method: 'POST',
		body,
	});
	const json = await res.json();
	return json.tokens;
}
export async function decodeTokens(tokens: number[]): Promise<string> {
	const body = JSON.stringify({ tokens });
	const res = await fetch('/api/tokens/decode', {
		method: 'POST',
		body,
	});
	const json = await res.json();
	return json.text;
}
