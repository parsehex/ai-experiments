'use client';
import React, { useState } from 'react';
import { ChatBox } from '@/components/ChatBox';
import { PromptPart, RawMessage, Message } from '@/lib/types/llm';
import { complete } from '@/lib/llm';
import { addMsg, makeMsg } from '@/lib/utils/messages';
import AIModelStatus from '@/components/AIModelStatus';

const getResponse = async (input: string, messages: Message[]) => {
	const system: PromptPart[] = [
		{
			val: 'Continue the following conversation between a user and an AI assistant.',
		},
	];
	const user: PromptPart[] = [{ val: input }];
	const prior_msgs = messages.map((msg) => ({
		role: msg.role,
		content: msg.content,
	}));
	const response = await complete(
		{ user, system, prefix_response: 'RESPONSE: ', prior_msgs },
		{ temp: 0.5, max: 150, stop: ['RESPONSE:', '<|im_end|>', '\n\n'] }
	);
	return response;
};

const defaultMsg = makeMsg(
	'message',
	'assistant',
	"Hi, I'm a chatbot. How can I help you today?"
);
function SimpleChat() {
	const [messages, setMessages] = useState<Message[]>([defaultMsg]);

	const handleSend = async (input: string) => {
		if (!input.trim()) return;

		const userMsg = makeMsg('message', 'user', input);
		const newMsgs = addMsg(userMsg, messages, setMessages);

		const resMsg = makeMsg(
			'message',
			'assistant',
			await getResponse(input, newMsgs)
		);
		addMsg(resMsg, newMsgs, setMessages);
	};

	return (
		<div className="chat-container">
			<AIModelStatus type="llm" />
			<ChatBox
				messages={messages}
				setMessages={setMessages}
				handleSend={handleSend}
			/>
		</div>
	);
}

export default SimpleChat;
