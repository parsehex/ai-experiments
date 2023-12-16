import { PromptPart, PromptPartResponse } from '@/lib/types/llm';
import { Message } from '@/lib/types/llm';
import { getMsgBefore } from '@/lib/utils/messages';

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
			val: 'The following INPUT is a chat between a user and an assistant.\n',
		},
		{
			val: "Your task is to figure out what the user's intent is, out of the following Intent Areas. You must pick one that describes the intent of the user.\n",
		},
		{
			val: areasStr + '\n',
		},
		{
			val: 'Respond with a string containing the key of the above Area that you pick only.\n',
		},
	];
	const userMsg = getMsgBefore(
		messages,
		(m) => m.role.toLowerCase() === 'user'
	);
	const user: PromptPart[] = [
		{ use: !!summary, val: 'Chat Summary: ' + summary + '\n' },
		{ val: `User INPUT: ${userMsg?.content}\n` },
	];
	const prefixResponse = 'INTENT:';
	return { prefixResponse, system, user };
}
