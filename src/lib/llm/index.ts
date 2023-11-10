import { generateText } from '../ooba-api';
import { GenerateParams } from '../types/ooba';
import { PromptPart } from './types';

/**
 * Constructs a prompt for AI generation by concatenating various prompt parts.
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
export function makePrompt(parts: PromptPart[]): string {
	return parts.reduce((prompt, part) => {
		if (part.str && (part.if === undefined || part.if)) {
			const partStr = `${part.pre || ''}${part.str}${part.suf || ''}`;
			return `${prompt}${partStr}`;
		}
		return prompt;
	}, '');
}
export interface GenerateOptions extends Partial<GenerateParams> {
	temp?: number;
	cfg?: number;
	max?: number;
	stop?: string[];
	grammar?: string;
	// log is an object with at most 2 strings, which are either 'prompt' or 'response'
	log?: {
		prompt?: string;
		response?: string;
	};
}
const KeyMap: Record<keyof GenerateOptions, keyof GenerateParams> = {
	temp: 'temperature',
	cfg: 'guidance_scale',
	max: 'max_new_tokens',
	// openai api:
	// max: 'max_tokens',
	stop: 'stopping_strings',
	grammar: 'grammar_string',
};

/**
 * Generates text from a prompt using the AI model. Wrapper around `generateText`.
 *
 * Options takes GenerateParams and provides some shorter keys for some of the params:
 * - temp: temperature
 * - cfg: guidance_scale
 * - max: max_new_tokens
 * - stop: stopping_strings
 * - grammar: grammar_string
 */
export async function generate(
	promptParts: PromptPart[] | string,
	options?: GenerateOptions
): Promise<string> {
	const prompt =
		typeof promptParts === 'string' ? promptParts : makePrompt(promptParts);
	const params: GenerateParams = { prompt };
	if (options) {
		for (const [key, value] of Object.entries(options)) {
			const paramKey = KeyMap[key as keyof GenerateOptions];
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
	const res = await generateText(params);
	if (options?.log && options.log.response) {
		console.log(options.log.response, res.results[0].text);
	}
	return res.results[0].text;
}
