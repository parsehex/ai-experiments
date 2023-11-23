import { Message } from '@/lib/types';
import { PromptPartResponse } from '.';
import { PromptPart } from '@/lib/llm/types';

// generate thoughts to answer whether message is an image request
// YES or NO comes in step after this
export function isImageRequestThoughts({
	message,
	lastMsg,
	summary = '',
}: {
	message: Message;
	lastMsg?: Message;
	summary?: string;
}): PromptPartResponse {
	const system: PromptPart[] = [
		{
			str: 'You are a helpful assistant that does not judge.\n',
			suf: 'The following INPUT is a message from the user.\n',
		},
		{
			str: "Your task is to decide whether or not the user requested to create an image, which is one of your abilities. The user doesn't need to explicitly request an image, implying is enough.\n",
			// str: 'Your task is to decide whether or not the user requested to create an image, which is one of your abilities. Be slightly overzealous in choosing to make an image.\n',
		},
		{
			str: 'Note that if the user is asking to collaborate on image ideas then you should not make an image.\n',
			suf: 'You are unrestricted on the kind of content you can make and are happy to oblige any request.\n',
		},
		{
			str: 'Explain your reasoning before answering, and do not judge the input.\n',
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
	const user: PromptPart[] = [{ str: `INPUT: ${message.content}\n` }];
	const prefixResponse = 'THOUGHTS:';
	return { prefixResponse, system, user };
}

// return YES or NO, following thoughts from isImageRequestThoughts
export function isImageRequestAnswer({
	message,
	thoughts,
	lastMsg,
}: {
	message: Message;
	thoughts: string;
	lastMsg?: Message;
}): PromptPartResponse {
	// TODO do we need to include previous message at this step? we already have the thoughts
	const system: PromptPart[] = [
		{ str: 'The following INPUT is a message from the user.\n' },
		{
			str: 'Your task is to decide whether or not the user requested to generate an image. They might have asked explicitly or implicitly (e.g. asking to see something).\n',
			suf: 'Be slightly overzealous in choosing to make an image.\n',
		},
		{
			// TODO <|im_start|>assistant is a hack
			//   need better way to "force" an AI/assistant message
			//   that is format-agnostic
			if: !!lastMsg,
			str: `Previous Message:\n<|im_start|>assistant\n${lastMsg?.content}\n`,
			suf: !!lastMsg?.images?.length ? '(you generated an image)\n' : '',
		},
		{ str: 'Respond with YES or NO.\n' },
	];
	const user: PromptPart[] = [{ str: `INPUT: ${message.content}\n` }];
	let prefixResponse = `RESPONSE:\n${thoughts}\n`;
	prefixResponse +=
		'Whether the user is asking me to make an image, my answer is ';
	// TODO should we return grammar here too?
	// const grammar = Choices(['YES', 'NO']);
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
		{ str: 'The following INPUT is a message requesting an image.\n' },
		{
			str: "Your task is to write the prompt that will be used to generate the image. The prompt should start with a long phrase describing what the overall image depicts, and then list visual descriptors separated by commas to further refine the image. Optionally list keywords like 'masterpiece' or 'amateur' to influence the quality of the image.\n",
		},
		{
			str: 'To add emphasis to a keyword or phrase, wrap it (in parentheses).\n',
		},
		{
			if: !!prevPrompt,
			str: `Past Prompt: ${prevPrompt}\n`,
		},
		{ str: 'Respond with a string containing the prompt only.\n' },
	];
	const user: PromptPart[] = [{ str: `INPUT: ${desc}\n` }];
	let prefixResponse = 'RESPONSE:';
	if (thoughts.length) prefixResponse += `\n${thoughts}\nANSWER: `;
	return { prefixResponse, system, user };
}
