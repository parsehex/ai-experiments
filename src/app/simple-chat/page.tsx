'use client';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types';
import { withPage } from '@/components/Page';
import { generate } from '@/lib/llm';

const title = 'Simple Chat';

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

		const response = await generate(prompt, {
			temp: 0.5,
			max: 150,
		});
		return response;
	};

	return (
		<div className="chat-container">
			<ChatBox
				messages={messages}
				setMessages={setMessages}
				handleSend={handleSend}
			/>
		</div>
	);
}

export default withPage({ title })(SimpleChat);
