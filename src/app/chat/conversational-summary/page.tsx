'use client';
import React, { useState, useEffect } from 'react';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/app/types';
import * as ooba from '../../ooba-api';
import { v4 } from 'uuid';

const innerMonologue = async (messages: Message[]) => {
	// there should be at least 2 messages, pick the last 2
	let prompt = 'Think about how to respond to the following chat:\n';
	const lastMessage = messages[messages.length - 1];
	prompt += `${lastMessage.role}: ${lastMessage.content}\n`;
	const secondLastMessage = messages[messages.length - 2];
	prompt += `${secondLastMessage.role}: ${secondLastMessage.content}\n`;
	prompt += 'THOUGHTS: ';
	const result = await ooba.generateText({
		prompt,
		temperature: 0.15,
		guidance_scale: 2,
		stopping_strings: ['RESPONSE:', 'INPUT:', '\n'],
	});
	console.log(prompt, result);
	return result.results[0].text;
};

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
	console.log(prompt, result);
	return result.results[0].text;
};

const constructPrompt = (
	input: string,
	lastMessageWithRole: string,
	summary?: string,
	thoughts?: string
) => {
	const s = `\nThis is a summary of the chat so far: ${summary}`;
	const t = `\nThese are your thoughts on how to respond: ${thoughts}`;
	return `Continue the following chat between USER and ASSISTANT by responding to the INPUT in one paragraph or less.${
		summary ? s : ''
	}${thoughts ? t : ''}
${lastMessageWithRole}
INPUT: ${input}
RESPONSE: `;
};

const sendInput = async (
	input: string,
	lastMessageWithRole: string,
	summary?: string,
	thoughts?: string
) => {
	const prompt = constructPrompt(input, lastMessageWithRole, summary, thoughts);
	const result = await ooba.generateText({
		prompt,
		temperature: 1,
		guidance_scale: 1.5,
		stopping_strings: ['INPUT:', 'RESPONSE:'],
	});
	console.log(prompt, result);
	return result.results[0].text;
};

// idea: inner monologue - at each summarize step, also generate a prompt to the LLM to think how to respond. this will be included in later prompts
//   for this, we also need to extend chatbox to allow for collapsed messages to express thoughts.

function ConversationalSummaryChat() {
	const [messages, setMessages] = useState([
		{
			role: 'ASSISTANT',
			content: "Hi, I'm a chatbot. How can I help you?",
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

		const thoughts = await innerMonologue(newMessages);
		newMessages = [
			...newMessages,
			{ role: 'ASSISTANT', content: thoughts, id: v4(), type: 'thought' },
		];
		setMessages(newMessages);

		const chatSummary = summary || '';
		const lastMessage = messages[messages.length - 1];
		const response = await sendInput(
			userInput,
			`${lastMessage.role}: ${lastMessage.content.trim()}`,
			chatSummary,
			thoughts
		);

		newMessages = [
			...newMessages,
			{ role: 'ASSISTANT', content: response, id: resMsgId },
		];
		setMessages(newMessages);

		const msgsToSummarize = [
			...newMessages.filter((msg) => msg.type !== 'thought'),
		];
		// we should only summarize the new messages
		if (msgsToSummarize.length > 2 && summary) {
			msgsToSummarize.splice(0, msgsToSummarize.length - 2);
		}
		const result = await summarize(msgsToSummarize, chatSummary);
		setSummary(result);
	};

	return (
		<div>
			<h1>Chat - Conversational Summary</h1>
			<div className="container">
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
