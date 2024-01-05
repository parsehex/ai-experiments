type SBool = 'True' | 'False';

export interface Sampler {
	name: string;
	aliases: string[];
	options: {
		scheduler: string;
		second_order?: SBool;
		brownian_noise?: SBool;
	};
}

export interface txt2imgParams {
	prompt: string;
	negative_prompt: string;
	// styles: string[];
	seed: number;
	// sampler_name: string;
	// batch_size: number;
	// n_iter: number;
	num_inference_steps: number;
	guidance_scale: number;
	width: number;
	height: number;
	// restore_faces: boolean;
	// do_not_save_samples: boolean;
	// do_not_save_grid: boolean;
}

/** The format of the parsed `info` prop of a txt2img request */
export interface txt2imgResponseInfo {
	prompt: string;
	// all_prompts: string[];
	negative_prompt: string;
	// all_negative_prompts: string[];
	seed: number;
	// all_seeds: number[];
	// subseed: number;
	// all_subseeds: number[];
	// subseed_strength: number;
	width: number;
	height: number;
	// sampler_name: string;
	guidance_scale: number;
	num_inference_steps: number;
	// batch_size: number;
	/** Contains 1+ strings that contain info about the generation. Seems like a good thing to show the user. */
	// infotexts: string[];
}
export interface txt2imgResponse {
	images: string[]; // array of base64-png(s)
	// parameters?: Partial<txt2imgParams>; // copy of the parameters passed to the api
	info: string; // the final params used to generate the images, find seed here
	nsfw_content_detected: boolean[];
}

export interface Lora {
	name: string;
	alias: string;
	path: string;
	metadata: {};
}
export type LoraResponse = Lora[];
