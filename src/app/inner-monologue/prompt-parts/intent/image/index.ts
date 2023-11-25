import { Message } from '@/lib/types';
import { PromptPartResponse } from '../..';
import { PromptPart } from '@/lib/llm/types';
import { Choices } from '@/lib/llm/grammar';
import { getLastMsgBefore } from '@/lib/utils';

export * from './image-prompt';
export * from './loras';

const Intents = {
	GENERATE: 'User wants an image to be made at this point in the conversation',
	REVISE: 'User wants to revise a previous image',
	PLAN: 'User wants to plan an image to make later',
};

export function pickImageIntent({
	messages,
	summary = '',
}: {
	messages: Message[];
	summary?: string;
}): PromptPartResponse {
	const userMsg = getLastMsgBefore(
		messages,
		(m) => m.role.toLowerCase() === 'user'
	);
	if (!userMsg) throw new Error('No user message found');
	const lastMsg = getLastMsgBefore(
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
