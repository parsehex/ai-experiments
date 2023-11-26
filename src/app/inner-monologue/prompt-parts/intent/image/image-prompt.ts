import { Message } from '@/lib/types';
import { PromptPartResponse } from '../..';
import { PromptPart } from '@/lib/llm/types';

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
			str: `Your task is to describe the image that you want to make.
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

export function makeImgPrompt({
	desc,
	prevPrompt = '',
	thoughts = '',
}: {
	desc: string;
	prevPrompt: string;
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
			str: `Write a prompt similar to the following but in significantly more detail:
photo of a sunrise over a mountain range with a large village in-between. masterpiece, high quality, morning, bloom, stunning\n`,
		},
		// {
		// 	if: !!prevPrompt,
		// 	str: `Past Prompt: ${prevPrompt}\n`,
		// },
		{
			str: 'Respond with a string containing the prompt that follows the above format.\n',
		},
	];
	const user: PromptPart[] = [{ str: `INPUT: ${desc}\n` }];
	let prefixResponse = 'RESPONSE:';
	if (thoughts.length) prefixResponse += `\n${thoughts}\nPROMPT:\n`;
	return { prefixResponse, system, user };
}
