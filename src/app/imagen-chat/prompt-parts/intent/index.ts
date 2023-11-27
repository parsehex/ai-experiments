import { PromptPart, PromptPartResponse } from '@/lib/types/llm';
import { Message } from '@/lib/types';
import { getMsgBefore } from '@/lib/utils';

export * from './image';

const AreasOfintent = {
	IMAGE: 'User is talking about generating an image or wants to see an image',
	TEXT: 'User wants a written response',
};

export function pickAreaOfIntent({
	messages,
	summary = '',
}: {
	messages: Message[];
	summary?: string;
}): PromptPartResponse {
	const areasStr = JSON.stringify(AreasOfintent, null, '\t');
	const system: PromptPart[] = [
		{
			str: 'The following INPUT is a chat between a user and an assistant.\n',
		},
		{
			str: "Your task is to figure out what the user's intent is, out of the following Intent Areas. You must pick one that describes the intent of the user.\n",
		},
		{
			str: areasStr + '\n',
		},
		{
			str: 'Respond with a string containing the key of the above Area that you pick only.\n',
		},
	];
	const userMsg = getMsgBefore(
		messages,
		(m) => m.role.toLowerCase() === 'user'
	);
	const user: PromptPart[] = [
		{ if: !!summary, str: 'Chat Summary: ' + summary + '\n' },
		{ str: `User INPUT: ${userMsg?.content}\n` },
	];
	const prefixResponse = 'INTENT:';
	return { prefixResponse, system, user };
}
