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
} from './types/ooba';
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
	const response = await fetch(`${BASE_URL}/api/v1/model`);
	return response.json();
}

export async function generateText(
	params: GenerateParams
): Promise<GenerateResponse> {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/api/v1/generate`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(params),
	});
	return response.json();
}

export async function chat(params: ChatParams): Promise<ChatResponse> {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/api/v1/chat`, {
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
	const response = await fetch(`${BASE_URL}/api/v1/stop-stream`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});
	return response.json();
}

export async function modelAction(
	options: ModelOptions
): Promise<ModelActionResponse> {
	if (!adjusted) fixUrl();
	const response = await fetch(`${BASE_URL}/api/v1/model`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(options),
	});
	return response.json();
}
export async function listModels(): Promise<ListModelsResponse> {
	return await modelAction({ action: 'list' });
}
export async function modelInfo(): Promise<ModelInfoResponse> {
	return await modelAction({ action: 'info' });
}
export async function loadModel(
	model_name: string,
	args?: Record<string, any>
): Promise<ModelInfoResponse> {
	return await modelAction({ action: 'load', model_name, args });
}
export async function unloadModel(): Promise<ModelInfoResponse> {
	return await modelAction({ action: 'unload' });
}

// sample args for Luna-AI-Llama2-Uncensored-GPTQ:
// {'model_basename': 'gptq_model-4bit-128g', 'device': 'cuda:0', 'use_triton': True, 'inject_fused_attention': True, 'inject_fused_mlp': True, 'use_safetensors': True, 'trust_remote_code': False, 'max_memory': {0: '11GiB', 'cpu': '99GiB'}, 'quantize_config': None, 'use_cuda_fp16': True, 'disable_exllama': False}
