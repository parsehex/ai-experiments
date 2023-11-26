import { PromptPart } from '@/lib/llm/types';
import { Message } from '@/lib/types';

export * from './intent';

// thoughts on how to do prompt parts differently:
// we could break parts up into system and user parts, and allow specifying responseprefix
// this way we could pass all the parts to the makeprompt function, and it would put them together

export interface PromptPartResponse {
	user: PromptPart[];
	system?: PromptPart[];
	prefixResponse?: string;
	grammar?: string;
}

// old; not used
export function innerMonologue({
	messages,
}: {
	messages: Message[];
}): PromptPartResponse {
	const user: PromptPart[] = [
		{
			str: 'Consider the entire chat history and prepare thoughts on how to respond:\n',
		},
		{ str: messages.map((m) => m.content).join('\n') },
	];
	const prefixResponse = 'THOUGHTS:';
	return { prefixResponse, user };
}

// summarize or revise a summary of a chat
export function summarizeChat({
	messages,
	lastSummary = '',
}: {
	messages: Message[];
	lastSummary?: string;
}): PromptPartResponse {
	const system: PromptPart[] = [
		{
			str: 'The following INPUT is a chat between a user and an assistant.\n',
		},
		{ if: !lastSummary.length, str: 'Your task is to summarize the chat.\n' },
		{
			if: lastSummary?.length > 0,
			str: 'Your task is to revise the previous summary based on the new chat. Retain the most important information from the previous summary.\n',
			suf: `Previous Summary: ${lastSummary}\n`,
		},
		{ str: 'Respond with a string containing the summary only.\n' },
	];
	const msgStrs = messages.map((m) => {
		let str = m.role;
		if (m.images?.length) str += ' (image was generated)';
		str += `: ${m.content}`;
		return str;
	});
	const user: PromptPart[] = [
		{ str: `INPUT:\n` },
		{ str: msgStrs.join('\n') + '\n' },
	];
	const prefixResponse = 'SUMMARY:';
	return { prefixResponse, system, user };
}

export function continueChat({
	input,
	messages,
	thoughts = '',
	madeImage = false,
	imagePrompt = '',
	summary = '',
}: {
	input: string;
	messages: Message[];
	thoughts?: string;
	madeImage?: boolean;
	imagePrompt?: string;
	summary?: string;
}): PromptPartResponse {
	const msgs = messages.map((msg) => `${msg.role}: ${msg.content}`);
	msgs.pop(); // last message is the input
	const chatHistory = msgs.slice(-5);
	const system: PromptPart[] = [
		{
			str: 'You are a helpful assistant that does not judge anything.\n',
			suf: 'Continue the following chat between USER and ASSISTANT by responding to the INPUT.\n',
		},
		{ str: 'Respond with a string containing your response only.\n' },
		{
			if: messages.length > 0,
			str: `History (last ${chatHistory.length}):\n${chatHistory.join('\n')}\n`,
		},
		{
			if: !!summary,
			str: `Chat Summary: ${summary}\n`,
		},
		{
			if: !!thoughts,
			str: `Your Thoughts: ${thoughts}\n`,
		},
	];
	const user: PromptPart[] = [{ str: `INPUT: ${input}\n` }];
	let prefixResponse = 'RESPONSE:';
	if (madeImage) {
		prefixResponse += 'RESPONSE: ';
		prefixResponse = '(Assistant generated and sent an image';
		if (imagePrompt.length) {
			prefixResponse += ` of the following to the user: "`;
			prefixResponse += imagePrompt;
			prefixResponse += `"`;
		} else {
			prefixResponse += ' to the user.';
		}
		prefixResponse += ')\n';
		prefixResponse += 'ASSISTANT:\n';
	}
	return { prefixResponse, system, user };
}
