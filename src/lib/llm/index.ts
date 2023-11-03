import { generateText } from '../ooba-api';
import { GenerateParams } from '../ooba-types';
import { PromptPart } from './types';

export const DefaultParams: Partial<GenerateParams> = {
	temperature: 0.01,
	guidance_scale: 1.05,
};

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

interface GenerateOptions {
	temp?: number;
	cfg?: number;
	max?: number;
	stop?: string[];
}
const KeyMap: Record<string, keyof GenerateOptions> = {
	temperature: 'temp',
	guidance_scale: 'cfg',
	max_new_tokens: 'max',
	stopping_strings: 'stop',
};

export async function generate(
	promptParts: PromptPart[],
	options?: GenerateOptions
): Promise<string> {
	const prompt = makePrompt(promptParts);
	const params: GenerateParams = { prompt };
	if (options) {
		for (const [key, value] of Object.entries(options)) {
			const paramKey = KeyMap[key];
			if (paramKey) {
				params[paramKey] = value;
			} else {
				params[key] = value;
			}
		}
	}
	console.log(prompt);
	const res = await generateText(params);
	return res.results[0].text;
}
