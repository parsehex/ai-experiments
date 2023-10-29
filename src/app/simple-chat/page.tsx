'use client';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/app/types';
import { ChatBox } from '@/components/ChatBox';
import * as ooba from '@/app/ooba-api';

function SimpleChat() {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: uuidv4(),
			role: 'ASSISTANT',
			content: "Hi, I'm a chatbot. How can I help you today?",
		},
	]);

	const handleSend = async (input: string) => {
		if (!input.trim()) return;

		const userMessage = { id: uuidv4(), role: 'USER', content: input.trim() };
		const newMessages = [...messages, userMessage];
		setMessages(newMessages);

		const response = {
			id: uuidv4(),
			role: 'ASSISTANT',
			content: await getAIResponse(input.trim()),
		};
		setMessages([...newMessages, response]);
	};

	const getAIResponse = async (input: string) => {
		let messagesStr = messages
			.map((msg) => `${msg.role}: ${msg.content}`)
			.join('\n');
		const lastRole = messages[messages.length - 1].role;
		const role = lastRole === 'USER' ? 'ASSISTANT' : 'USER';
		messagesStr += `\n${role}: ${input}`;
		const prompt = `<|im_start|>system
Continue the following conversation between a user and an AI assistant.<|im_end|>
<|im_start|>user
${messagesStr}<|im_end|>
<|im_start|>assistant\n`;
		console.log(prompt);

		const response = await ooba.generateText({
			prompt,
			temperature: 0.5,
			max_new_tokens: 150,
		});
		return response.results[0].text;
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl mb-4">Simple Chat</h1>
			<div className="chat-container">
				<ChatBox
					messages={messages}
					setMessages={setMessages}
					handleSend={handleSend}
				/>
			</div>
		</div>
	);
}

export default SimpleChat;
