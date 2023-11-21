// first api to support is sd

import { cors } from '../utils';

// base: localhost:7860
// get samplers: GET /sdapi/v1/samplers
// try to stop generation: POST /sdapi/v1/interrupt
// txt2img: POST /sdapi/v1/txt2img (body: txt2imgParams) ->

type SBool = 'True' | 'False';

interface Sampler {
	name: string;
	aliases: string[];
	options: {
		scheduler: string;
		second_order?: SBool;
		brownian_noise?: SBool;
	};
}

interface txt2imgParams {
	prompt: string;
	negative_prompt: string;
	styles: string[];
	seed: number;
	sampler_name: string;
	batch_size: number;
	n_iter: number;
	steps: number;
	cfg_scale: number;
	width: number;
	height: number;
	restore_faces: boolean;
	do_not_save_samples: boolean;
	do_not_save_grid: boolean;
}

/** The format of the parsed `info` prop of a txt2img request */
export interface txt2imgResponseInfo {
	prompt: string;
	all_prompts: string[];
	negative_prompt: string;
	all_negative_prompts: string[];
	seed: number;
	all_seeds: number[];
	subseed: number;
	all_subseeds: number[];
	subseed_strength: number;
	width: number;
	height: number;
	sampler_name: string;
	cfg_scale: number;
	steps: number;
	batch_size: number;
	/** Contains 1+ strings that contain info about the generation. Seems like a good thing to show the user. */
	infotexts: string[];
}
interface txt2imgResponse {
	images: string[]; // array of base64-png(s)
	parameters: Partial<txt2imgParams>; // copy of the parameters passed to the api
	info: string; // the final params used to generate the images, find seed here
}

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
