'use client';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types/llm';
import { generate } from '@/lib/llm';
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
			<p>
				This chat is hardcoded to use the <u>ChatML</u> prompt format. For best
				results, use an appropriate model.
			</p>
			<ChatBox
				messages={messages}
				setMessages={setMessages}
				handleSend={handleSend}
			/>
		</div>
	);
}

export default SimpleChat;
