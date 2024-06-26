// need to think about how to handle this
// some formats have a system section
// in formats that dont, i guess just start the user message with the system?

import { stringFromPromptParts } from '.';
import {
	PromptFormatsObj,
	PromptFormatResponse,
	PromptPart,
	RawMessage,
} from '../types/llm';

// (user = user.trim()), (system = system?.trim());
// this is just trimming both strings
const PromptFormats: PromptFormatsObj = {
	// a handful of models seem to work fine without much of a prompt format
	flexible: (user: string, system?: string) => {
		(user = user.trim()), (system = system?.trim());
		let str = '';
		if (system) str += `${system}\n`;
		str += `${user}\n`;
		str += 'RESPONSE:\n';
		return str;
	},
	Alpaca: (user: string, system?: string) => {
		(user = user.trim()), (system = system?.trim());
		let str = '';
		if (system) str += `${system}\n\n`;
		str += `### Instruction:\n${user}\n`;
		str += '### Response:\n';
		return str;
	},
	// several models use this: mistral
	ChatML: (user: string, system?: string) => {
		(user = user.trim()), (system = system?.trim());
		let str = '';
		if (system) str += `<|im_start|>system\n${system}<|im_end|>\n`;
		str += `<|im_start|>user\n${user}<|im_end|>\n`;
		str += '<|im_start|>assistant\n';
		return str;
	},
	// luna-ai
	UserAssistant: (user: string, system?: string) => {
		(user = user.trim()), (system = system?.trim());
		let str = '';
		if (system) str += `${system}\n`;
		str += `USER: ${user}\n`;
		str += 'ASSISTANT:\n';
		return str;
	},
	// this one's different, it needs to return an array of message objects
	OpenAI: (user: string, system?: string) => {
		(user = user.trim()), (system = system?.trim());
		let arr = [];
		if (system) arr.push({ role: 'system', content: system });
		arr.push({ role: 'user', content: user });
		return arr as RawMessage[];
	},
};
const ModelPromptFormats = {};

export function makePrompt(
	user: string | PromptPart[],
	system?: string | PromptPart[],
	/** One of: `flexible`, `ChatML`, `UserAssistant`, 'OpenAI' */
	format = 'flexible'
): PromptFormatResponse {
	const promptFormat = PromptFormats[format];
	if (Array.isArray(user)) user = stringFromPromptParts(user);
	if (Array.isArray(system)) system = stringFromPromptParts(system);
	if (!promptFormat) {
		console.error('Prompt format not found:', format);
		return '';
	}
	return promptFormat(user, system);
}

// function recommendFormat(modelName: string)
export function recommendFormat(modelName: string) {
	// not good enough
	// if (modelName === 'mistral') return 'flexible';
	if (modelName === 'mistral') return 'ChatML';
	if (modelName === 'luna-ai') return 'UserAssistant';
	return 'flexible';
}
