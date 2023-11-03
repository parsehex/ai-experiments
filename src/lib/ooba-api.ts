// base: http://localhost:5000
// endpoints:
// GET /api/v1/model : { result: { 'model_name', 'lora_names', 'shared.settings', 'shared.args'} }
// POST /api/v1/generate (Parameters) : { results: [{ text }] }
// POST /api/v1/chat (ParametersChat) : { results: [{ history }] }
// POST /api/v1/stop-stream : { results: 'success' }
// POST /api/v1/model (ModelOptions, [action=load|unload|list|info]) : { result: any }
// POST /api/v1/token-count ({ prompt: string }) : { results: { tokens: number } }

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
} from './ooba-types';

const BASE_URL = 'http://localhost:5000';

export async function getModel(): Promise<ModelInfo> {
	const response = await fetch(`${BASE_URL}/api/v1/model`);
	return response.json();
}

export async function generateText(
	params: GenerateParams
): Promise<GenerateResponse> {
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
