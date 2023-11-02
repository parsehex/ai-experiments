'use client';
import React, { useState, useEffect } from 'react';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/app/types';
import * as ooba from '@/app/ooba-api';
import { v4 } from 'uuid';

const summarize = async (messages: Message[], summary?: string) => {
	let prompt = 'Summarize the following chat in one paragraph:\n';
	if (summary) {
		prompt = `This is a summary of the chat so far: ${summary}\n`;
		prompt +=
			'Revise the summary based on the following new messages in the chat in one paragraph:\n';
	}
	for (let msg of messages) {
		prompt += `${msg.role}: ${msg.content}\n`;
	}
	prompt += '\nSUMMARY: ';
	const result = await ooba.generateText({
		prompt,
		temperature: 0.01,
		guidance_scale: 1.2,
	});
	console.log('summary', prompt, result);
	return result.results[0].text;
};

const constructPrompt = (
	input: string,
	lastMessageWithRole: string,
	summary?: string
) => {
	const s = `\nThis is a summary of the chat so far: ${summary}`;
	return `Continue the following chat between USER and ASSISTANT by responding to the INPUT in a submissive manner.${
		summary ? s : ''
	}
${lastMessageWithRole}
INPUT: ${input}
RESPONSE: `;
};

const sendInput = async (
	input: string,
	lastMessageWithRole: string,
	summary?: string
) => {
	const prompt = constructPrompt(input, lastMessageWithRole, summary);
	const result = await ooba.generateText({
		prompt,
		max_new_tokens: 1500,
		temperature: 0.25,
		guidance_scale: 1.5,
		stopping_strings: ['INPUT:', 'RESPONSE:'],
	});
	console.log('message', prompt, result);
	return result.results[0].text;
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
		<div>
			<h1>Chat - Conversational Summary</h1>
			<div className="container">
				<button className="clear-button" onClick={handleClear}>
					Clear
				</button>
				<ChatBox
					messages={messages}
					setMessages={setMessages}
					readOnly={true}
				/>
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
		</div>
	);
}

export default ConversationalSummaryChat;
