// ooba has announced an openai-compatible api, with a few extra features
// list models with GET /v1/models, then load with GET /v1/models/<model_name>
// audio transcription works with a change to the extension

import {
	ModelInfo,
	GenerateParams,
	GenerateResponse,
	ChatParams,
	ChatResponse,
	StopStreamResponse,
	ModelOptions,
	ModelActionResponse,
	ListModelsResponse,
	ModelInfoResponse,
	NewModelInfo,
} from './types/ooba.new';
import { cors } from './utils';

let BASE_URL = 'http://localhost:5000';
let adjusted = false;

function fixUrl() {
	if (adjusted) return;
	let host = location.host.split(':')[0]; // Remove port number if exists
	// Regular expression for IPv4 address
	let ipPattern = new RegExp(
		'^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
	);
	if (ipPattern.test(host)) {
		BASE_URL = `http://${host}:5000`;
	} else if (host.includes('.')) {
		// BASE_URL = '';
	}
	BASE_URL = cors(BASE_URL);
	adjusted = true;
}

export async function getModel(): Promise<ModelInfo> {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/v1/internal/model/info`);
	return response.json();
}

export async function generateText(
	params: GenerateParams
): Promise<GenerateResponse> {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/v1/completions#/generate`, {
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
	const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(params),
	});
	return response.json();
}

export async function stopStream(): Promise<StopStreamResponse> {
	if (!adjusted) fixUrl();
	// requires latest version of ooba
	const response = await fetch(`${BASE_URL}/v1/internal/stop-generation`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});
	return response.json();
}
interface CurrentModelResponse {
	model_name: string;
	lora_names: string[];
}
export async function getCurrentModel(): Promise<CurrentModelResponse> {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/v1/internal/model/info`);
	return response.json();
}

// export async function modelAction(
// 	options: ModelOptions
// ): Promise<ModelActionResponse> {
// 	if (!adjusted) fixUrl();
// 	const response = await fetch(`${BASE_URL}/api/v1/model`, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json',
// 		},
// 		body: JSON.stringify(options),
// 	});
// 	return response.json();
// }
// export async function modelInfo(): Promise<ModelInfoResponse> {
// 	return await modelAction({ action: 'info' });
// }

/** List models or get info on a specific model */
export async function listModels(
	name = ''
): Promise<ListModelsResponse | NewModelInfo> {
	if (!adjusted) fixUrl();
	let url = `${BASE_URL}/v1/models`;
	if (name) url += `/${name}`;
	const response = await fetch(url);
	return response.json();
}
export async function loadModel(modelName: string): Promise<ModelInfoResponse> {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/v1/internal/model/load`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ model_name: modelName }),
	});
	return response.json();
}

export async function tokenCount(str: string) {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/v1/internal/token-count`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ text: str }),
	});
	return response.json();
}

// no unload model endpoint
// export async function unloadModel(): Promise<ModelInfoResponse> {
// 	return await modelAction({ action: 'unload' });
// }
