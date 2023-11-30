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
import { addCorsIfNot } from './utils';

let BASE_URL = 'http://localhost:5000';
let adjusted = false;

function fixUrl() {
	if (adjusted) return;
	BASE_URL = addCorsIfNot(BASE_URL, 5000);
	adjusted = true;
}

export async function getCurrentModel(): Promise<string> {
	if (!adjusted) fixUrl();
	const response = await listModels();
	return response.result[0];
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
	model_name: string
): Promise<ModelInfoResponse> {
	return await modelAction({ action: 'load', model_name });
}
export async function unloadModel(): Promise<ModelInfoResponse> {
	return await modelAction({ action: 'unload' });
}

// sample args for Luna-AI-Llama2-Uncensored-GPTQ:
// {'model_basename': 'gptq_model-4bit-128g', 'device': 'cuda:0', 'use_triton': True, 'inject_fused_attention': True, 'inject_fused_mlp': True, 'use_safetensors': True, 'trust_remote_code': False, 'max_memory': {0: '11GiB', 'cpu': '99GiB'}, 'quantize_config': None, 'use_cuda_fp16': True, 'disable_exllama': False}
