'use client';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types';
import { generate } from '@/lib/llm';
import { makePrompt } from '@/lib/llm/prompts';
import { txt2img } from '@/lib/imagen';


const innerMonologue = async (messages: Message[]) => {
	let prompt =
		'Consider the entire chat history and prepare thoughts on how to respond:\n';
	messages.forEach((message) => {
		prompt += `${message.role}: ${message.content}\n`;
	});
	prompt += 'THOUGHTS: ';

	const result = await generate(prompt, {
		temp: 0.5,
		cfg: 2,
		stop: ['RESPONSE:', 'INPUT:', '\n'],
		ban_eos_token: true,
	});
	console.log('thought', prompt, result);
	return result;
};

const isImgReq = async (message: Message) => {
	// TODO probably need to include chat summary
	// in case user asks for an image in a way that only makes sense
	// in the context of the chat (they already made images)
	// or maybe even use a "haveMadeImagesThisChat" which we pass
	// to the llm
	// Idea: keep a list of images generated with prompts
	//   can show them along the side of the chat

	// The following INPUT is a message from the user. Your task is to decide whether the user might be interested in generating an image based on their message. If the message suggests, either explicitly or implicitly, that an image could be relevant or interesting in the context of the conversation (e.g., discussing a concept, object, or scene that can be visualized), lean towards responding with YES. Only respond with NO if it's quite clear that an image is not related to the user's intent. Err on the side of suggesting an image generation when in doubt.

	let instructions = 'The following INPUT is a message from the user.\n';
	instructions +=
		'Your task is to decide whether or not the user requested to generate an image. They might have asked explicitly or implicitly (e.g. asking to see something).\n';
	instructions += 'Respond with YES or NO.\n';
	const inputStr = `INPUT: ${message.content}\n`;
	const prompt = makePrompt(inputStr, instructions, 'ChatML');
	const result = await generate(prompt, {
		prefixResponse: 'RESPONSE:',
		// cfg: 1.25,
		max: 5,
		stop: ['RESPONSE:', 'INPUT:', '\n'],
	});
	return result;
};
const extractImgDesc = async (message: Message) => {
	let instructions =
		'The following INPUT is a message that describes an image in some way.\n';
	instructions +=
		"Your task is to extract the description. Retain as many of the same words as possible, don't add words unless necessary.\n";
	instructions += 'Respond with a string containing the description only.\n';
	const inputStr = `INPUT: ${message.content}\n`;
	const prompt = makePrompt(inputStr, instructions, 'ChatML');
	const result = await generate(prompt, {
		max: 256,
		stop: ['RESPONSE:', 'INPUT:', '\n'],
	});
	return result;
};
const imgPrompt = async (desc: string) => {
	let instructions =
		'The following INPUT is a description of a requested image.\n';
	instructions +=
		'Your task is to write the prompt that will be used to generate the image. The prompt should start with a long phrase describing what the overall image depicts, and then lists visual descriptors separated by commas to further refine the image.\n';
	instructions += 'Respond with a string containing the prompt only.\n';
	const inputStr = `INPUT: ${desc}\n`;
	const prompt = makePrompt(inputStr, instructions, 'ChatML');
	const result = await generate(prompt, {
		max: 256,
		stop: ['RESPONSE:', 'INPUT:', '\n'],
	});
	return result;
};

interface ExtraObj {
	thoughts?: string;
	madeImage?: boolean;
}

const sendInput = async (
	input: string,
	messages: Message[],
	{ thoughts, madeImage }: ExtraObj = {}
) => {
	const chatHistory = messages
		.map((msg) => `${msg.role}: ${msg.content}`)
		.join('\n');
	const thoughtStr = thoughts
		? `\nThese are your thoughts on how to respond: ${thoughts}`
		: '';
	const imgStr = madeImage
		? '\n(You generated an image. It will automatically be included, there is no action necessary on your part.)'
		: '';
	let prompt =
		'Continue the following chat between USER and ASSISTANT by responding to the INPUT.\n';
	prompt += 'Respond with a string containing your response only.\n';
	prompt += `${chatHistory}${thoughtStr}\n`;
	prompt += `INPUT: ${input}\n`;
	prompt += imgStr;
	prompt += 'RESPONSE: ';
	const result = await generate(prompt, {
		max: 1500,
		temp: 0.25,
		cfg: 1.5,
		stop: ['INPUT:', 'RESPONSE:', 'USER:'],
		mirostat_mode: 2,
	});
	console.log('message', prompt, result);
	return result;
};

interface Options {
	wide: boolean;
	expandImages: boolean;
}
const DefaultOptions: Options = {
	wide: true,
	expandImages: true,
};

function InnerMonologueChat() {
	const [messages, setMessages] = useState<Message[]>([
		{
			role: 'ASSISTANT',
			content: 'Hi, what do you want to talk about?',
			id: uuidv4(),
		},
	]);
	const [input, setInput] = useState('');
	const [options, setOptions] = useState(DefaultOptions);

	const handleSend = async (userInput: string) => {
		if (!userInput) return;
		setInput('');

		const newMessages = [
			...messages,
			{ role: 'USER', content: userInput, id: uuidv4() },
		];
		const userMsg = newMessages[newMessages.length - 1];
		setMessages(newMessages);

		// const thoughts = await innerMonologue(newMessages);
		// newMessages.push({
		// 	role: 'ASSISTANT',
		// 	content: thoughts,
		// 	id: uuidv4(),
		// 	type: 'thought',
		// });
		// setMessages(newMessages);

		let image: string | undefined;

		const imgReq = await isImgReq(userMsg);
		if (imgReq.includes('YES')) {
			const userDesc = await extractImgDesc(userMsg);
			const prompt = await imgPrompt(userDesc);
			const res = await txt2img({
				prompt,
				negative_prompt: '',
				sampler_name: 'Euler a',
				cfg_scale: 4.5,
				batch_size: 1,
				n_iter: 1,
				steps: 10,
				width: 512,
				height: 768,
			});
			image = res.images[0];
			console.log('userDesc', userDesc, '- prompt', prompt);
		}

		// const response = await sendInput(userInput, newMessages, thoughts);
		const response = await sendInput(userInput, newMessages, {
			madeImage: !!image,
		});
		const aiMessage: Message = {
			role: 'ASSISTANT',
			content: response,
			id: uuidv4(),
		};
		if (image) {
			aiMessage.images = [image];
			console.log('image', image);
		}
		setMessages([...newMessages, aiMessage]);
	};

	const handleClear = () => {
		console.clear();
		setMessages([]);
		setInput('');
	};

	return (
		<div className={`inner-monologue-chat ${options.wide ? '' : 'container'}`}>
			<div>
				<button className="delete" onClick={handleClear}>
					Clear
				</button>
				<label>
					Wide
					<input
						type="checkbox"
						checked={options.wide}
						onChange={(e) => setOptions({ ...options, wide: e.target.checked })}
					/>
				</label>
				<label>
					Expand Images
					<input
						type="checkbox"
						checked={options.expandImages}
						onChange={(e) =>
							setOptions({ ...options, expandImages: e.target.checked })
						}
					/>
				</label>
			</div>
			<ChatBox
				messages={messages}
				setMessages={setMessages}
				readOnly={true}
				handleSend={handleSend}
				defExpandImages={options.expandImages}
			/>
			{/* <div className="input-container px-2">
				<input
					className="input mr-2 grow"
					type="text"
					onKeyDown={(e) => e.key === 'Enter' && handleSend()}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your message..."
					autoFocus
				/>
				<button className="basic text-md py-2" onClick={handleSend}>
					Send
				</button>
			</div> */}
		</div>
	);
}

export default InnerMonologueChat;
