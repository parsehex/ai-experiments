'use client';
import React, { useState } from 'react';
import { ChatBox } from '@/components/ChatBox';
import { complete } from '@/lib/llm';
import { PromptPart, Message } from '@/lib/types/llm';
import { addMsg, makeMsg } from '@/lib/utils/messages';

const summarize = async (messages: Message[], summary?: string) => {
	const msgs = messages.map((msg) => `${msg.role}: ${msg.content}\n`).join('');
	const parts: PromptPart[] = [
		{ val: 'Summarize the following chat in one paragraph:\n', use: !summary },
		{
			val: `This is a summary of the chat so far: ${summary}
Revise the summary based on the following new messages in the chat in one paragraph:\n`,
			use: !!summary,
		},
		{ val: msgs },
	];
	const result = await complete(
		{
			user: parts,
			prefix_response: '\nSUMMARY: ',
		},
		{ cfg: 1.2 }
	);
	console.log('summary', prompt, result);
	return result;
};

const sendInput = async (
	input: string,
	lastMessageWithRole: string,
	summary?: string
) => {
	const parts: PromptPart[] = [
		{
			val: `Continue the following chat between USER and ASSISTANT by responding to the INPUT.\n`,
		},
		{
			val: `This is a summary of the chat so far: ${summary}\n`,
			use: !!summary,
		},
		{ val: `${lastMessageWithRole}`, suf: '\n' },
		{ val: `INPUT: ${input}` },
	];
	const result = await complete(
		{
			user: parts,
			prefix_response: '\nRESPONSE: ',
		},
		{ cfg: 1.2, temp: 0.25, max: 1500, stop: ['INPUT:', 'RESPONSE:'] }
	);
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

		const userMsg = makeMsg('message', 'user', userInput);
		let newMessages = addMsg(userMsg, messages, setMessages);

		const chatSummary = summary || '';
		const lastMsg = messages[messages.length - 1];
		let lastMesgWithRole = '';
		if (lastMsg) {
			lastMesgWithRole = `${lastMsg.role}: ${lastMsg.content}`;
		}
		const response = await sendInput(userInput, lastMesgWithRole, chatSummary);

		const resMsg = makeMsg('message', 'assistant', response);
		newMessages = addMsg(resMsg, newMessages, setMessages);

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
