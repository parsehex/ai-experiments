// first api to support is sd

import { LoadModelResponse, UnloadModelResponse } from '../types/new-api';
import { addCorsIfNot } from '../utils';
import { Lora, Sampler, txt2imgParams, txt2imgResponse } from './types';

// base: localhost:7860
// get samplers: GET /sdapi/v1/samplers
// try to stop generation: POST /sdapi/v1/interrupt
// txt2img: POST /sdapi/v1/txt2img (body: txt2imgParams) ->

let BASE_URL = 'http://localhost:5000';
let adjusted = false;

function fixUrl() {
	if (adjusted) return;
	BASE_URL = addCorsIfNot(BASE_URL, 5000);
	adjusted = true;
}

// function ideas
// getStatus

export async function getSamplers(): Promise<string[]> {
	if (!adjusted) fixUrl();
	const res = await fetch(`${BASE_URL}/img/v1/list-samplers`);
	const r = await res.json();
	return r.samplers;
}
export async function getLoras(): Promise<Lora[]> {
	if (!adjusted) fixUrl();
	const res = await fetch(`${BASE_URL}/img/v1/list-loras`);
	return await res.json();
}

export async function listModels(): Promise<string[]> {
	if (!adjusted) fixUrl();
	const res = await fetch(`${BASE_URL}/img/v1/list-models`);
	const r = await res.json();
	return r.models;
}

// getModel
export async function getModel(): Promise<string> {
	if (!adjusted) fixUrl();
	const res = await fetch(`${BASE_URL}/img/v1/model`);
	const r = await res.json();
	return r.model;
}

// loadModel
export async function loadModel(model: string): Promise<LoadModelResponse> {
	if (!adjusted) fixUrl();
	const res = await fetch(`${BASE_URL}/img/v1/model/load`, {
		method: 'POST',
		body: JSON.stringify({ model }),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	return await res.json();
}

// unloadModel
export async function unloadModel(): Promise<UnloadModelResponse> {
	if (!adjusted) fixUrl();
	const res = await fetch(`${BASE_URL}/img/v1/model/unload`, {
		method: 'POST',
		body: JSON.stringify({}),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	return await res.json();
}

export async function txt2img(
	params: Partial<txt2imgParams>
): Promise<txt2imgResponse> {
	if (!adjusted) fixUrl();
	const res = await fetch(`${BASE_URL}/img/v1/txt2img`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	return await res.json();
}
