import { PromptPart } from '../types/llm';
import {
	// ModelInfo,
	// GenerateParams,
	// GenerateResponse,
	ChatParams,
	ChatResponse,
	StopStreamResponse,
	ModelOptions,
	ModelActionResponse,
	ListModelsResponse,
	ModelInfoResponse,
	NewModelInfo,
} from '../types/ooba.new';
import { addCorsIfNot } from '../utils';

interface GenerateParams {
	prompt?: string;
	parts?: PromptPart[];
	return_prompt?: boolean;
	temperature?: number;
	max_tokens?: number;
	prefixResponse?: string;
	grammar?: string;
	stop?: string[];
}
interface GenerateResponse {
	result: {
		id: string;
		object: string;
		created: number;
		model: string;
		choices: {
			text: string;
			index: number;
			logprobs: {
				// idk what this is
			} | null;
			finish_reason: 'stop' | 'length';
		}[];
		usage: {
			prompt_tokens: number;
			completion_tokens: number;
			total_tokens: number;
		};
	};
	prompt?: string;
}

interface ModelInfo {
	model_name: string;
}

// raw completion endpoint: POST /llm/v1/complete
// chat-style: POST /llm/v1/chat

let BASE_URL = 'http://localhost:5000';
let adjusted = false;

function fixUrl() {
	if (adjusted) return;
	BASE_URL = addCorsIfNot(BASE_URL, 5000);
	adjusted = true;
}

export async function getModel(): Promise<ModelInfo> {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/llm/v1/model`);
	return response.json();
}

export async function generateText(
	params: GenerateParams
): Promise<GenerateResponse> {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/llm/v1/complete`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(params),
	});
	return response.json();
}

export async function chat(params: any): Promise<ChatResponse> {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/llm/v1/chat`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(params),
	});
	return response.json();
}

// export async function stopStream(): Promise<StopStreamResponse> {
// 	if (!adjusted) fixUrl();
// 	// requires latest version of ooba
// 	const response = await fetch(`${BASE_URL}/v1/internal/stop-generation`, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json',
// 		},
// 	});
// 	return response.json();
// }
// interface CurrentModelResponse {
// 	model_name: string;
// 	lora_names: string[];
// }
// export async function getCurrentModel(): Promise<CurrentModelResponse> {
// 	if (!adjusted) fixUrl();
// 	const response = await fetch(`${BASE_URL}/v1/internal/model/info`);
// 	return response.json();
// }

/** List models or get info on a specific model */
// export async function listModels(name = ''): Promise<ListModelsResponse> {
// 	if (!adjusted) fixUrl();
// 	let url = `${BASE_URL}/v1/models`;
// 	if (name) url += `/${name}`;
// 	const response = await fetch(url);
// 	return response.json();
// }
// export async function loadModel(modelName: string): Promise<ModelInfoResponse> {
// 	if (!adjusted) fixUrl();
// 	const response = await fetch(`${BASE_URL}/v1/internal/model/load`, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json',
// 		},
// 		body: JSON.stringify({ model_name: modelName }),
// 	});
// 	return response.json();
// }

// export async function countTokens(str: string): Promise<number> {
// 	if (!adjusted) fixUrl();
// 	const response = await fetch(`${BASE_URL}/v1/internal/token-count`, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json',
// 		},
// 		body: JSON.stringify({ text: str }),
// 	});
// 	const res = await response.json();
// 	return res.length;
// }
// export async function encodeTokens(str: string): Promise<number[]> {
// 	if (!adjusted) fixUrl();
// 	const response = await fetch(`${BASE_URL}/v1/internal/encode`, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json',
// 		},
// 		body: JSON.stringify({ text: str }),
// 	});
// 	const res = (await response.json()) as { tokens: number[]; length: number };
// 	return res.tokens;
// 	// what is 1? seems blank
// }
// export async function decodeTokens(tokens: number[]): Promise<string> {
// 	if (!adjusted) fixUrl();
// 	const response = await fetch(`${BASE_URL}/v1/internal/decode`, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json',
// 		},
// 		body: JSON.stringify({ tokens }),
// 	});
// 	const res = await response.json();
// 	return res.text;
// }
