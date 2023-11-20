'use client';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types';
import { generate } from '@/lib/llm';


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
		stopping_strings: ['RESPONSE:', 'INPUT:', '\n'],
		ban_eos_token: true,
	});
	console.log('thought', prompt, result);
	return result;
};

const constructPrompt = (
	input: string,
	messages: Message[],
	thoughts?: string
) => {
	let chatHistory = messages
		.map((msg) => `${msg.role}: ${msg.content}`)
		.join('\n');
	const t = thoughts
		? `\nThese are your thoughts on how to respond: ${thoughts}`
		: '';

	return `Continue the following chat between USER and ASSISTANT by responding to the INPUT.
${chatHistory}${t}
INPUT: ${input}
RESPONSE:\n`;
};

const sendInput = async (
	input: string,
	messages: Message[],
	thoughts?: string
) => {
	const prompt = constructPrompt(input, messages, thoughts);
	const result = await generate(prompt, {
		max: 1500,
		temp: 0.25,
		cfg: 1.5,
		stop: ['INPUT:', 'RESPONSE:'],
		mirostat_mode: 2,
	});
	console.log('message', prompt, result);
	return result;
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

	const handleSend = async () => {
		const userInput = input;
		if (!userInput) return;
		setInput('');

		const newMessages = [
			...messages,
			{ role: 'USER', content: userInput, id: uuidv4() },
		];
		setMessages(newMessages);

		const thoughts = await innerMonologue(newMessages);
		newMessages.push({
			role: 'ASSISTANT',
			content: thoughts,
			id: uuidv4(),
			type: 'thought',
		});
		setMessages(newMessages);

		const response = await sendInput(userInput, newMessages, thoughts);
		newMessages.push({ role: 'ASSISTANT', content: response, id: uuidv4() });
		setMessages(newMessages);
	};

	const handleClear = () => {
		console.clear();
		setMessages([]);
		setInput('');
	};

	return (
		<div className="container">
			<button className="clear-button" onClick={handleClear}>
				Clear
			</button>
			<ChatBox messages={messages} setMessages={setMessages} readOnly={true} />
			<div className="input-container px-2">
				<input
					className="input mr-2 grow"
					type="text"
					onKeyDown={(e) => e.key === 'Enter' && handleSend()}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your message..."
					autoFocus
				/>
				<button onClick={handleSend}>Send</button>
			</div>
		</div>
	);
}

export default InnerMonologueChat;
