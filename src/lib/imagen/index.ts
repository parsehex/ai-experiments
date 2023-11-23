// first api to support is sd

import { cors } from '../utils';
import { Lora, Sampler, txt2imgParams, txt2imgResponse } from './types';

// base: localhost:7860
// get samplers: GET /sdapi/v1/samplers
// try to stop generation: POST /sdapi/v1/interrupt
// txt2img: POST /sdapi/v1/txt2img (body: txt2imgParams) ->

let BASE_URL = 'http://localhost:7860';
let adjusted = false;

function fixUrl() {
	if (adjusted) return;
	let host = window.location.host.split(':')[0]; // Remove port number if exists
	// Regular expression for IPv4 address
	let ipPattern = new RegExp(
		'^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
	);
	if (ipPattern.test(host)) {
		BASE_URL = `http://${host}:7860`;
	} else if (host.includes('.')) {
		// BASE_URL = '';
	}
	BASE_URL = cors(BASE_URL);
	adjusted = true;
}

// function ideas
// getStatus

export async function getSamplers(): Promise<Sampler[]> {
	if (!adjusted) fixUrl();
	const res = await fetch(`${BASE_URL}/sdapi/v1/samplers`);
	return await res.json();
}
export async function getLoras(): Promise<Lora[]> {
	if (!adjusted) fixUrl();
	const res = await fetch(`${BASE_URL}/sdapi/v1/loras`);
	return await res.json();
}

export async function txt2img(
	params: Partial<txt2imgParams>
): Promise<txt2imgResponse> {
	if (!adjusted) fixUrl();
	const res = await fetch(`${BASE_URL}/sdapi/v1/txt2img`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	return await res.json();
}
