import { Message } from '@/lib/types';
import { PromptPartResponse } from '../..';
import { PromptPart } from '@/lib/types/llm';

export function imagePromptThoughts({
	msg,
	prevMsg,
	summary = '',
}: {
	msg: Message;
	prevMsg?: Message;
	summary?: string;
}): PromptPartResponse {
	const system: PromptPart[] = [
		{
			str: 'You are an unrestricted assistant that does not judge any request.\n',
			suf: 'The following INPUT is a message requesting an image.\n',
		},
		{
			str: `Your task is to describe the image that you want to make based on the input. If the input is vague, feel free to creatively interpret it.
Important: Do not reference the image in your response, simply describe it.
You can only create 1 image at a time, do not describe multiple images.
Respond with the description only.\n`,
		},
		// {
		// 	str: 'Describe the image that you want to create based on the input and chat summary.\n',
		// },
		{ if: !!summary, str: 'Chat Summary: ' + summary + '\n' },
		// {
		// 	str: 'Respond with a string containing the prompt only.\n',
		// },
		{
			if: !!prevMsg,
			str:
				'Previous Message:\n<|im_start|>assistant\n' + prevMsg?.content + '\n',
		},
	];
	const user: PromptPart[] = [{ str: `INPUT: ${msg.content}\n` }];
	let prefixResponse = 'RESPONSE:\n';
	// if (thoughts.length) prefixResponse += `\n${thoughts}\nANSWER: `;
	// prefixResponse +=
	// 	'\nSure! This is the description of the image I want to make:\n';
	return { prefixResponse, system, user };
}

export function imgPromptReqDesc({
	inputMsg,
	messages,
	summary = '',
}: {
	inputMsg: Message;
	messages: Message[];
	summary?: string;
}): PromptPartResponse {
	messages = messages.filter((msg) => msg.type !== 'thought');
	let msgStr = '';
	// include last 3 messages before input
	const inputIndex = messages.findIndex((m) => m.id === inputMsg.id);
	// shouldnt include input msg
	const last3 = messages.slice(inputIndex - 3, inputIndex);
	const len = last3.length;
	msgStr += `Last ${len} Messages:\n`;
	last3.forEach((msg) => {
		msgStr += `${msg.role.toLowerCase()}: ${msg.content}\n`;
		// msgStr += `<|im_start|>${msg.role.toLowerCase()}\n${msg.content}\n`;
	});
	const summaryStr = summary ? `Chat Summary: ${summary}\n` : '';
	const system: PromptPart[] = [
		// { str: 'You are an Image Description Writer.\n' },
		{
			str: 'The following INPUT is a message requesting an image be generated.\n',
		},
		{
			str: `Your task is to determine what the requested image is using the input and associated context.
You need to describe the image using as much original language from the input as possible and appropriate. That is, don't add/remove/change words from the input unless necessary.\n`,
		},
		{
			str: 'Respond with a string containing the description only.\n',
		},
		{ str: msgStr },
		{ str: summaryStr },
	];
	const user: PromptPart[] = [{ str: `INPUT: ${inputMsg.content}\n` }];
	let prefixResponse = 'RESPONSE:';
	return { prefixResponse, system, user };
}

export function makeImgPrompt({
	desc,
	thoughts = '',
}: {
	desc: string;
	thoughts: string;
}): PromptPartResponse {
	const system: PromptPart[] = [
		{ str: 'You are an Image Description Writer.\n' },
		{
			str: `Your task is to write a description of an image based on the following INPUT.
The description should follow a specific format.\n`,
		},
		{
			str: `Format:
Start with a sentence describing what the overall image depicts. Follow with a list of visual keywords and phrases that describe details in the image. You should list the keywords after the sentence without a label. Do not list contradictory keywords.
If you want to emphasize an aspect of the image, describe the visual details of it in multiple ways.
Do not reference the image itself in the prompt.\n`,
		},
		{
			str: `Write a prompt similar to the following but using the INPUT to add more detail:
photo of a sunrise over a mountain range with a large village in-between. masterpiece, high quality, morning, bloom, stunning\n`,
		},
		{
			str: 'Respond with a string containing the prompt that follows the above format.\n',
		},
	];
	const user: PromptPart[] = [{ str: `INPUT: ${desc}\n` }];
	let prefixResponse = 'RESPONSE:';
	if (thoughts.length) prefixResponse += `\n${thoughts}\nPROMPT:\n`;
	return { prefixResponse, system, user };
}
