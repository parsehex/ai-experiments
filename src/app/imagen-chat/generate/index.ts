import { toast } from 'react-toastify';
import { GenerateOptions, generate } from '@/lib/llm';
import { makePrompt } from '@/lib/llm/prompts';
import { Message } from '@/lib/types';
import * as parts from '../prompt-parts';

export * from './image';

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

// TODO function to get full Intent-path from input

export const innerMonologue = async (messages: Message[]) => {
	messages = messages.filter((msg) => msg.type !== 'thought');
	const promptParts = parts.innerMonologue({ messages });
	const { prefixResponse, user, system } = promptParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
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
	const { prefixResponse, user, system } = promptParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
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
	const { prefixResponse, user, system } = promptParts;
	let result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
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
	const { prefixResponse, user, system } = promptParts;
	let result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
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
	const { prefixResponse, user, system } = pickLorasParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
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
	const { prefixResponse, user, system } = promptParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
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
	const { prefixResponse, user, system } = promptParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
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
	const { prefixResponse, user, system } = promptParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			max: 16,
			prefixResponse,
			temp: 0.25,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	return result;
};
