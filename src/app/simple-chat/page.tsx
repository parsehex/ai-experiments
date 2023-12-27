'use client';
import React, { useState } from 'react';
import { ChatBox } from '@/components/ChatBox';
import { Message, PromptPart } from '@/lib/types/llm';
import { complete, generate } from '@/lib/llm';
import { addMsg, makeMsg } from '@/lib/utils/messages';

function SimpleChat() {
	const defMsg = makeMsg(
		'message',
		'ASSISTANT',
		"Hi, I'm a chatbot. How can I help you today?"
	);
	const [messages, setMessages] = useState<Message[]>([defMsg]);

	const handleSend = async (input: string) => {
		if (!input.trim()) return;

		const userMsg = makeMsg('message', 'USER', input);
		const newMsgs = addMsg(userMsg, messages, setMessages);

		const resMsg = makeMsg('message', 'ASSISTANT', await getAIResponse(input));
		addMsg(resMsg, newMsgs, setMessages);
	};

	const getAIResponse = async (input: string) => {
		let messagesStr = messages
			.map((msg) => `${msg.role}: ${msg.content}`)
			.join('\n');
		const lastRole = messages[messages.length - 1].role;
		const role = lastRole === 'USER' ? 'ASSISTANT' : 'USER';
		messagesStr += `\n${role}: ${input}`;
		const parts: PromptPart[] = [
			{
				val: 'Continue the following conversation between a user and an AI assistant.',
			},
			{ val: messagesStr },
		];
		console.log(prompt);

		const response = await complete(
			{ user: parts, prefix_response: '\nRESPONSE: ' },
			{ temp: 0.5, max: 150, stop: ['RESPONSE:'] }
		);
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

export default SimpleChat;
