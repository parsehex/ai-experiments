import * as ooba from './ooba-api.new';
import * as newapi from './new-api';
import * as openai from './openai-api';
import { GenerateParams } from '../types/ooba.new';
import {
	PromptPart,
	PromptFormatResponse,
	Message,
	RawMessage,
} from '../types/llm';

// TODO add getTokenIDs function to get ids of tokens in a string using whichever api is being used

/**
 * Constructs a prompt for LLM generation by concatenating various prompt parts.
 * Each part can be conditionally included based on a boolean condition and can
 * have optional prefixes or suffixes attached to it (empty content str is ignored too).
 *
 * The function iterates over an array of `PromptPart` objects, each representing
 * a segment of the prompt with its own inclusion condition and optional prefix
 * or suffix. If the condition is true or undefined, the segment is included in
 * the prompt with its prefix and suffix applied. The final prompt is a
 * concatenation of all included segments in the order they appear in the array.
 *
 * @param {PromptPart[]} parts - An array of `PromptPart` objects that define the segments of the prompt.
 * @returns {string} The constructed prompt string ready for AI processing.
 */
export function stringFromPromptParts(parts: PromptPart[]): string {
	return parts.reduce((prompt, part) => {
		if (part.val && (part.use === undefined || part.use)) {
			const partStr = `${part.pre || ''}${part.val}${part.suf || ''}`;
			return `${prompt}${partStr}`;
		}
		return prompt;
	}, '');
}
export interface GenerateOptions extends Partial<GenerateParams> {
	model?: string;
	/** Required if using OpenAI */
	api_key?: string;
	temp?: number;
	cfg?: number;
	max?: number;
	stop?: string[];
	grammar?: string;
	prefixResponse?: string;
	// log is an object with at most 2 strings, which are either 'prompt' or 'response'
	log?: {
		prompt?: string;
		response?: string;
	};
}

type ParamKeyMap = Record<keyof GenerateOptions, keyof GenerateParams>;
const KeyMap: ParamKeyMap = {
	api_key: '',
	temp: 'temperature',
	cfg: 'guidance_scale',
	max: 'max_tokens',
	stop: 'stop',
	grammar: 'grammar_string',
	tokenBans: 'custom_token_bans',
};
const NewKeyMap: ParamKeyMap = {
	api_key: '',
	temp: 'temperature',
	cfg: '',
	max: 'max_tokens',
	stop: 'stop',
	grammar: '',
	tokenBans: '',
};
const OpenAIKeyMap: ParamKeyMap = {
	api_key: 'api_key',
	temp: 'temperature',
	cfg: '',
	max: 'max_tokens',
	stop: 'stop',
	grammar: '',
	tokenBans: '',
};

const ModelKeyMap: Record<string, ParamKeyMap> = {
	ooba: KeyMap,
	new: NewKeyMap,
	OpenAI: OpenAIKeyMap,
};

const OpenAIModels = ['gpt-3.5', 'gpt-4'];

/**
 * Generates text from a prompt using the AI model. Wrapper around `generateText`.
 *
 * Options takes GenerateParams and provides some shorter keys for some of the params.
 */
export async function generate(
	promptParts: PromptPart[] | (Message | RawMessage)[] | string,
	options?: GenerateOptions
): Promise<string> {
	let modelType: 'ooba' | 'OpenAI' | 'new' | '' = '';
	let model = '';
	let promptFormat = 'flexible';
	let prompt: PromptFormatResponse = '';
	if (options?.model) {
		model = options.model;
		delete options.model;
		// check if model starts with an openai model name
		const openaiModel = OpenAIModels.find((m) => model.startsWith(m));
		if (openaiModel) {
			promptFormat = 'OpenAI';
			modelType = 'OpenAI';
			if (!options.api_key) {
				throw new Error(
					'OpenAI model requires api_key to be passed in options'
				);
			}
		} else {
			modelType = 'new';
		}
	} else {
		modelType = 'new';
	}
	if (Array.isArray(promptParts)) {
		// look at first part to determine type
		const firstPart = promptParts[0];
		// part is either a message object or a promptpart object
		if (promptFormat === 'OpenAI') {
			if (!('role' in firstPart))
				throw new Error(
					'OpenAI model requires prompt parts to be message objects'
				);
			prompt = promptParts as Message[];
		} else {
			prompt = stringFromPromptParts(promptParts as PromptPart[]);
		}
	} else if (typeof promptParts === 'string') {
		prompt = promptParts;
	}

	const params: GenerateParams = { prompt: prompt as any };
	if (options && modelType) {
		const modelKeyMap = ModelKeyMap[modelType];
		for (const [key, value] of Object.entries(options)) {
			const paramKey = modelKeyMap[key as keyof GenerateOptions];
			// remove falsy values that are not boolean, or remove empty paramKeys
			if (!value && typeof value !== 'boolean') {
				delete params[paramKey];
				continue;
			}
			if (paramKey) {
				params[paramKey] = value;
			} else {
				params[key as keyof GenerateParams] = value;
			}
		}
	}
	if (options?.log) {
		if (options.log.prompt) console.log(options.log.prompt, prompt);
		delete params.log;
	}
	if (options?.prefixResponse) {
		params.prompt = `${params.prompt}${options.prefixResponse}`;
		delete params.prefixResponse;
	}
	let res = '';
	if (modelType === 'new') {
		const resp = await newapi.generateText(params);
		res = resp.result.choices[0].text;
	} else if (modelType === 'OpenAI') {
		params.api_key = options?.api_key;
		params.model = model;
		params.messages = prompt as Message[];
		// @ts-ignore: prompt is not used for OpenAI
		//   we have messages instead
		delete params.prompt;
		const resp = await openai.generateText(params as any);
		res = resp.choices[0].message.content;
	} else {
		throw new Error('No model specified');
	}
	if (options?.log && options.log.response) {
		console.log(options.log.response, res);
	}
	return res;
}

export async function getModel(model: string): Promise<string> {
	if (model.startsWith('gpt-') || model.toLowerCase().includes('openai')) {
		return 'OpenAI';
	} else if (model) {
		const res = await newapi.getModel();
		return res.model_name || 'None';
	} else {
		throw new Error('No model specified');
	}
}

export async function countTokens(str: string, model: string): Promise<number> {
	if (model.startsWith('gpt-') || model.toLowerCase().includes('openai')) {
		return await openai.countTokens(str);
	} else if (model) {
		return await ooba.countTokens(str);
	} else {
		throw new Error('No model specified');
	}
}
export async function encodeTokens(
	str: string,
	model: string
): Promise<number[]> {
	if (model.startsWith('gpt-') || model.toLowerCase().includes('openai')) {
		return await openai.encodeTokens(str);
	} else if (model) {
		return await ooba.encodeTokens(str);
	} else {
		throw new Error('No model specified');
	}
}
export async function decodeTokens(
	tokens: number[],
	model: string
): Promise<string> {
	if (model.startsWith('gpt-') || model.toLowerCase().includes('openai')) {
		return await openai.decodeTokens(tokens);
	} else if (model) {
		return await ooba.decodeTokens(tokens);
	} else {
		throw new Error('No model specified');
	}
}

const DefaultLLMParams = {
	temp: 0.7,
	top_p: 0.9,
	max: 256,
	top_k: 20,
	repetition_penalty: 1.15,
	stop: ['RESPONSE:', 'INPUT:'],
};
export const Params = (p: GenerateOptions): GenerateOptions =>
	Object.assign({}, DefaultLLMParams, p);
