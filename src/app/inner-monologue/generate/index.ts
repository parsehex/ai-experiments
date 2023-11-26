import { GenerateOptions, generate } from '@/lib/llm';
import { makePrompt } from '@/lib/llm/prompts';
import { Message } from '@/lib/types';
import * as parts from '../prompt-parts';
import { toast } from 'react-toastify';

const DefaultLLMParams = {
	temp: 0.7,
	top_p: 0.9,
	max: 256,
	top_k: 20,
	repetition_penalty: 1.15,
	stop: ['RESPONSE:', 'INPUT:'],
};
const Params = (p: GenerateOptions): GenerateOptions =>
	Object.assign({}, DefaultLLMParams, p);

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
			stop: ['RESPONSE:', 'INPUT:', '\n'],
			tokenBans: '13',
		})
	);
	result = result.trim().replace(/"/g, '');
	// llm likes to use emojies, remove
	result = result.replace(/[\uD800-\uDFFF]./g, '');
	return result;
};
export const imgPrompt = async (
	desc: string,
	prevPrompt = '',
	thoughts = ''
) => {
	const promptParts = parts.makeImgPrompt({ desc, prevPrompt, thoughts });
	const { prefixResponse, user, system } = promptParts;
	let result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
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
	summary?: string;
}

export const continueChat = async (
	input: string,
	messages: Message[],
	{ thoughts, madeImage, summary }: ExtraObj = {}
) => {
	messages = messages.filter((msg) => msg.type !== 'thought');
	const promptParts = parts.continueChat({
		input,
		messages,
		thoughts,
		madeImage,
		summary,
	});
	const { prefixResponse, user, system } = promptParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
			max: 768,
			cfg: 1.5,
		})
	);
	return result;
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
