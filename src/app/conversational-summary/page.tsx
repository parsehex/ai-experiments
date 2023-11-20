'use client';
import React, { useState, useEffect } from 'react';
import { v4 } from 'uuid';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types';
import { generate } from '@/lib/llm';
import { PromptPart } from '@/lib/llm/types';

const summarize = async (messages: Message[], summary?: string) => {
	const msgs = messages.map((msg) => `${msg.role}: ${msg.content}\n`).join('');
	const parts: PromptPart[] = [
		{ str: 'Summarize the following chat in one paragraph:\n', if: !summary },
		{
			str: `This is a summary of the chat so far: ${summary}
Revise the summary based on the following new messages in the chat in one paragraph:\n`,
			if: !!summary,
		},
		{ str: `${msgs}\nSUMMARY: ` },
	];
	const result = await generate(parts, { cfg: 1.2 });
	console.log('summary', prompt, result);
	return result;
};

const sendInput = async (
	input: string,
	lastMessageWithRole: string,
	summary?: string
) => {
	const parts = [
		{
			str: `Continue the following chat between USER and ASSISTANT by responding to the INPUT.\n`,
		},
		{
			str: `This is a summary of the chat so far: ${summary}\n`,
			if: !!summary,
		},
		{ str: `${lastMessageWithRole}`, suf: '\n' },
		{ str: `INPUT: ${input}\nRERSPONSE: ` },
	];
	const result = await generate(parts, {
		cfg: 1.5,
		temp: 0.25,
		max: 1500,
		stop: ['INPUT:', 'RESPONSE:'],
	});
	console.log('message', prompt, result);
	return result;
};

function ConversationalSummaryChat() {
	const [messages, setMessages] = useState([
		{
			role: 'ASSISTANT',
			content: 'Hi, what do you want to talk about?',
		},
	] as Message[]);
	const [input, setInput] = useState('');
	const [summary, setSummary] = useState('');

	const handleSend = async () => {
		const userInput = input;
		if (!userInput) return;
		setInput('');

		const userMsgId = v4();
		const resMsgId = v4();
		let newMessages = [
			...messages,
			{ role: 'USER', content: userInput, id: userMsgId },
		] as Message[];
		setMessages(newMessages);

		const chatSummary = summary || '';
		const lastMessage = messages[messages.length - 1];
		let lastMessageWithRole = '';
		if (lastMessage) {
			lastMessageWithRole = `${lastMessage.role}: ${lastMessage.content}`;
		}
		const response = await sendInput(
			userInput,
			lastMessageWithRole,
			chatSummary
		);

		newMessages = [
			...newMessages,
			{ role: 'ASSISTANT', content: response, id: resMsgId },
		];
		setMessages(newMessages);

		const msgsToSummarize = [...newMessages];
		// we should only summarize the new messages
		if (msgsToSummarize.length > 2 && summary) {
			msgsToSummarize.splice(0, msgsToSummarize.length - 2);
		}
		const result = await summarize(msgsToSummarize, chatSummary);
		setSummary(result);
	};

	const handleClear = () => {
		console.clear();
		setMessages([]);
		setSummary('');
		setInput('');
	};

	return (
		<div className="container">
			<button className="clear-button" onClick={handleClear}>
				Clear
			</button>
			<ChatBox messages={messages} setMessages={setMessages} readOnly={true} />
			{summary && (
				<div className="summaryBox">
					<h2>Generated Summary</h2>
					<p>{summary}</p>
				</div>
			)}
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

export default ConversationalSummaryChat;
