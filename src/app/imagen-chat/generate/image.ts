import { generate, Params } from '@/lib/llm';
import { makePrompt } from '@/lib/llm/prompts';
import { Message } from '@/lib/types/llm';
import * as parts from '../prompt-parts';
import { toast } from 'react-toastify';

export const imgPromptFromInput = async (
	inputMsg: Message,
	messages: Message[],
	{ prevPrompt = '', summary }: { prevPrompt?: string; summary?: string }
) => {
	// this is a higher level function to get a prompt for an image from an input msg
	// it will have to do some steps to determine what the user wants to create a description of their request
	// that description will be used to generate the final prompt to generate the image
	//
	// first,
	const p = parts.imgPromptReqDesc({ inputMsg, messages, summary });
	const { prefixResponse, user, system } = p;
	let result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
			temp: 0.15,
			repetition_penalty: 1.25,
			truncation_length: 4098,
			stop: ['RESPONSE:', 'INPUT:', '\n', '<|im_end|>'],
			tokenBans: '13',
		})
	);
	result = result.trim().replace(/"/g, '');
	result = result.replace(/[\uD800-\uDFFF]./g, '');
	return result;
	// const promptParts = parts.makeImgPrompt({ desc, prevPrompt, thoughts });
	// const { prefixResponse, user, system } = promptParts;
	// let result = await generate(
	// 	makePrompt(user, system, 'ChatML'),
	// 	Params({
	// 		prefixResponse,
	// 		temp: 0.5,
	// 		repetition_penalty: 1.25,
	// 		truncation_length: 4098,
	// 		stop: ['RESPONSE:', 'INPUT:', '\n'],
	// 		tokenBans: '13',
	// 	})
	// );
	// result = result.trim().replace(/"/g, '');
	// // llm likes to use emojies, remove
	// result = result.replace(/[\uD800-\uDFFF]./g, '');
	// return result;
};
