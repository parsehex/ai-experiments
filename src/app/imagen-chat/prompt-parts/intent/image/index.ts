import { Message } from '@/lib/types';
import { PromptPartResponse } from '../..';
import { PromptPart } from '@/lib/types/llm';
import { Choices } from '@/lib/llm/grammar';
import { getMsgBefore } from '@/lib/utils';

export * from './image-prompt';
export * from './loras';

const Intents = {
	GENERATE:
		'User wants an image to be made at this point in the conversation; they are conveying what they want to see',
	REVISE: 'User wants to revise a previously-made image',
	PLAN: 'User wants to plan out an image to make in a collaborative manner with the Assistant',
};

export function pickImageIntent({
	messages,
	summary = '',
}: {
	messages: Message[];
	summary?: string;
}): PromptPartResponse {
	const userMsg = getMsgBefore(
		messages,
		(m) => m.role.toLowerCase() === 'user'
	);
	if (!userMsg) throw new Error('No user message found');
	const lastMsg = getMsgBefore(
		messages,
		(m) => {
			return m.role.toLowerCase() === 'assistant';
		},
		userMsg
	);
	const intentStr = JSON.stringify(Intents, null, '\t');
	const system: PromptPart[] = [
		{
			str: 'The following INPUT is a message from the user related to image generation.\n',
		},
		{
			str: `Your task is to figure out what the user wants to do based on what they said and prior chat context. You must pick one of the following Intents that describes what the user wants to do.\n`,
		},
		{ str: intentStr + '\n' },
		{
			str: 'Respond with a string containing the key of the above Intent that you pick only.\n',
		},
		{
			if: !!summary,
			str: `Chat Summary: ${summary}\n`,
		},
		{
			if: !!lastMsg,
			str: `Previous Message:\n<|im_start|>assistant\n${lastMsg?.content}\n`,
			suf: !!lastMsg?.images?.length ? '(you generated an image)\n' : '',
		},
	];
	const user: PromptPart[] = [{ str: `INPUT: ${userMsg.content}\n` }];
	const prefixResponse = 'RESPONSE:';
	return { prefixResponse, system, user };
}

// what do each of the intents mean?
// generate: make an image now
//   the user's message or context should convey what they want to see
//   given the message and context, construct a description of the image as faithful to the user's intent as possible
//   feed description forward to create image prompt
// revise: user wants to change an image to see a different version
//   identify the image that the user wants to change and extract its prompt
//   given the message, context, and past prompt, construct a description of the changes to make
//   revise prompt and regenerate image
// plan: user wants to plan the changes to an image prompt with the ai before making it
//   user's message may be about a new image or one that was previously generated
