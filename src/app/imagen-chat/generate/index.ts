import { toast } from 'react-toastify';
import { generate, Params, complete } from '@/lib/llm';
import { makePrompt } from '@/lib/llm/prompts';
import { Message } from '@/lib/types/llm';
import * as parts from '../prompt-parts';

export * from './image';

// TODO function to get full Intent-path from input

export const innerMonologue = async (messages: Message[]) => {
	messages = messages.filter((msg) => msg.type !== 'thought');
	const promptParts = parts.innerMonologue({ messages });
	const { prefix_response: prefixResponse, user, system } = promptParts;
	const result = await complete(
		{ user, system, prefix_response: prefixResponse },
		Params({
			cfg: 2,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
			ban_eos_token: true,
		})
	);
	return result;
};
export const summarizeChat = async (messages: Message[], lastSummary = '') => {
	messages = messages.filter((msg) => msg.type !== 'thought');
	const promptParts = parts.summarizeChat({ messages, lastSummary });
	const { prefix_response: prefixResponse, user, system } = promptParts;
	const result = await complete(
		{ user, system, prefix_response: prefixResponse },
		Params({
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	toast.success('Summary generated');
	return result;
};

export const imgPromptThoughts = async (
	msg: Message,
	prevMsg?: Message,
	summary = ''
) => {
	const promptParts = parts.imagePromptThoughts({ msg, prevMsg, summary });
	const { prefix_response: prefixResponse, user, system } = promptParts;
	let result = await complete(
		{ user, system, prefix_response: prefixResponse },
		Params({
			stop: ['RESPONSE:', 'INPUT:', '\n', '<|im_end|>'],
			tokenBans: '13',
		})
	);
	result = result.trim().replace(/"/g, '');
	// llm likes to use emojies, remove
	result = result.replace(/[\uD800-\uDFFF]./g, '');
	return result;
};
export const imgPrompt = async (desc: string, thoughts = '') => {
	const promptParts = parts.makeImgPrompt({ desc, thoughts });
	const { prefix_response: prefixResponse, user, system } = promptParts;
	let result = await complete(
		{ user, system, prefix_response: prefixResponse },
		Params({
			temp: 0.5,
			repetition_penalty: 1.25,
			truncation_length: 4098,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
			tokenBans: '13',
		})
	);
	result = result.trim().replace(/"/g, '');
	// llm likes to use emojies, remove
	result = result.replace(/[\uD800-\uDFFF]./g, '');
	return result;
};

export async function addLorasToPrompt(prompt: string) {
	// const loras = await getLoras();
	const pickLorasParts = parts.pickLoras({ prompt });
	const { prefix_response: prefixResponse, user, system } = pickLorasParts;
	const result = await complete(
		{ user, system, prefix_response: prefixResponse },
		Params({
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	console.log(result);
}

interface ExtraObj {
	thoughts?: string;
	madeImage?: boolean;
	imagePrompt?: string;
	summary?: string;
}

export const continueChat = async (
	input: string,
	messages: Message[],
	{ thoughts, madeImage, summary, imagePrompt }: ExtraObj = {}
) => {
	messages = messages.filter((msg) => msg.type !== 'thought');
	const promptParts = parts.continueChat({
		input,
		messages,
		thoughts,
		madeImage,
		imagePrompt,
		summary,
	});
	const { prefix_response: prefixResponse, user, system } = promptParts;
	const result = await complete(
		{ user, system, prefix_response: prefixResponse },
		Params({
			max: 512,
			temp: 0.5,
			custom_token_bans: '13',
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	return result.trim();
};

export const pickIntentArea = async (
	messages: Message[],
	{ summary }: ExtraObj = {}
) => {
	messages = messages.filter((msg) => msg.type !== 'thought');
	const promptParts = parts.pickAreaOfIntent({
		messages,
		summary,
	});
	const { prefix_response: prefixResponse, user, system } = promptParts;
	const result = await complete(
		{ user, system, prefix_response: prefixResponse },
		Params({
			temp: 0.25,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	return result;
};

export const pickImageIntent = async (
	messages: Message[],
	{ summary }: ExtraObj = {}
) => {
	messages = messages.filter((msg) => msg.type !== 'thought');
	const promptParts = parts.pickImageIntent({
		messages,
		summary,
	});
	const { prefix_response: prefixResponse, user, system } = promptParts;
	const result = await complete(
		{ user, system, prefix_response: prefixResponse },
		Params({
			max: 16,
			temp: 0.25,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	return result;
};
