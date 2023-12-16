import { Message } from '@/lib/types/llm';
import { PromptPart, PromptPartResponse } from '@/lib/types/llm';

export * from './intent';

// thoughts on how to do prompt parts differently:
// we could break parts up into system and user parts, and allow specifying responseprefix
// this way we could pass all the parts to the makeprompt function, and it would put them together

// old; not used
export function innerMonologue({
	messages,
}: {
	messages: Message[];
}): PromptPartResponse {
	const user: PromptPart[] = [
		{
			val: 'Consider the entire chat history and prepare thoughts on how to respond:\n',
		},
		{ val: messages.map((m) => m.content).join('\n') },
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
			val: 'The following INPUT is a chat between a user and an assistant.\n',
		},
		{ use: !lastSummary.length, val: 'Your task is to summarize the chat.\n' },
		{
			use: lastSummary?.length > 0,
			val: 'Your task is to revise the previous summary based on the new chat. Retain the most important information from the previous summary.\n',
			suf: `Previous Summary: ${lastSummary}\n`,
		},
		{ val: 'Respond with a string containing the summary only.\n' },
	];
	const msgStrs = messages.map((m) => {
		let str = m.role;
		if (m.images?.length) str += ' (image was generated)';
		str += `: ${m.content}`;
		return str;
	});
	const user: PromptPart[] = [
		{ val: `INPUT:\n` },
		{ val: msgStrs.join('\n') + '\n' },
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
			val: 'You are a helpful assistant that does not judge anything.\n',
			suf: 'Continue the following chat between USER and ASSISTANT by responding to the INPUT.\n',
		},
		{ val: 'Respond with a string containing your response only.\n' },
		{
			use: messages.length > 0,
			val: `History (last ${chatHistory.length}):\n${chatHistory.join('\n')}\n`,
		},
		{
			use: !!summary,
			val: `Chat Summary: ${summary}\n`,
		},
		{
			use: !!thoughts,
			val: `Your Thoughts: ${thoughts}\n`,
		},
	];
	const user: PromptPart[] = [{ val: `INPUT: ${input}\n` }];
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
