'use client';
import React, { useState, useEffect } from 'react';
import {
	AgentExecutor,
	initializeAgentExecutorWithOptions,
} from 'langchain/agents';
import { getTool } from '../tools';
import { getLLM } from '../llms';
import { Tool } from 'langchain/tools';
import { Serialized } from 'langchain/load/serializable';
import { testPrompts } from './prompts';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '../types';

// TODO add other chat routes to prototype other agents
// chat page that uses entity memory and displays entities, able to edit them

function Chat() {
	const [messages, setMessages] = useState([
		{
			role: 'assistant',
			content: "Hi, I'm a chatbot who can search the web. How can I help you?",
		},
	] as Message[]);
	const [input, setInput] = useState('');
	const [openaiKey, setOpenaiKey] = useState('');
	const [googleApiKey, setGoogleApiKey] = useState('');
	const [googleCseId, setGoogleCseId] = useState('');
	const [executor, setExecutor] = useState(null as AgentExecutor | null);

	const handleLLMStart = (llm: Serialized, ...args: any[]) => {
		console.log('llm start', llm, args);
	};

	useEffect(() => {
		fetch('/api/api-keys').then(async (res) => {
			const { OPENAI_API_KEY, GOOGLE_API_KEY, GOOGLE_CSE_ID } =
				await res.json();
			const lsOpenaiKey =
				window.localStorage.getItem('openaiKey') || OPENAI_API_KEY || '';
			const lsGoogleApiKey =
				window.localStorage.getItem('googleApiKey') || GOOGLE_API_KEY || '';
			const lsGoogleCseId =
				window.localStorage.getItem('googleCseId') || GOOGLE_CSE_ID || '';

			setOpenaiKey(lsOpenaiKey);
			setGoogleApiKey(lsGoogleApiKey);
			setGoogleCseId(lsGoogleCseId);
		});
	}, []);

	useEffect(() => {
		if (!openaiKey) return;
		const initializeExecutor = async () => {
			let tools: Tool[] = [getTool('browser', openaiKey)];
			if (googleApiKey && googleCseId)
				tools.push(getTool('gsearch', googleApiKey, googleCseId));
			const createdExecutor = await initializeAgentExecutorWithOptions(
				tools,
				getLLM('gpt35', openaiKey),
				{
					agentType: 'chat-conversational-react-description',
					// verbose: true,
					returnIntermediateSteps: true,
					// @ts-ignore
					callbacks: { handleLLMStart },
				}
			);
			setExecutor(createdExecutor);
		};

		initializeExecutor();
	}, [openaiKey, googleApiKey, googleCseId]);

	const handleSend = async () => {
		if (!executor) return;
		const userInput = input;
		setInput('');

		setMessages([
			...messages,
			{ role: 'user', content: userInput },
		] as Message[]);

		const result = await executor.call(
			{ input: userInput },
			// @ts-ignore
			[
				{
					handleChainStart: (...args) => console.log('chain start', args),
					handleLLMStart: (...args) => console.log('llm start', args),
				},
			]
		);
		console.log(result);

		const response = result?.output;

		const newMessages = [...messages, { role: 'user', content: userInput }];
		if (result?.intermediateSteps && result.intermediateSteps.length > 0) {
			for (let step of result.intermediateSteps) {
				newMessages.push({
					role: 'assistant-thinking',
					content: `[Using ${step.action.tool} (Input: ${step.action.toolInput})] ${step.observation}`,
				});
				console.log(step);
			}
		}
		newMessages.push({ role: 'assistant', content: response });

		setMessages(newMessages as Message[]);
	};

	const handleTest = async () => {
		setInput(testPrompts[Math.floor(Math.random() * testPrompts.length)]);
		handleSend();
	};

	return (
		<div>
			<input
				value={openaiKey}
				className="input"
				onChange={(e) => {
					setOpenaiKey(e.target.value);
					localStorage.setItem('openaiKey', e.target.value);
				}}
				placeholder="OpenAI key..."
			/>
			<input
				value={googleApiKey}
				className="input"
				onChange={(e) => {
					setGoogleApiKey(e.target.value);
					localStorage.setItem('googleApiKey', e.target.value);
				}}
				placeholder="Google API key..."
			/>
			<input
				value={googleCseId}
				className="input"
				onChange={(e) => {
					setGoogleCseId(e.target.value);
					localStorage.setItem('googleCseId', e.target.value);
				}}
				placeholder="Google CSE ID..."
			/>
			<div className="container">
				<ChatBox messages={messages} setMessages={setMessages} />
				<div className="input-container">
					<input
						className="input mr-2"
						type="text"
						onKeyDown={(e) => e.key === 'Enter' && handleSend()}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type your message..."
					/>
					<button onClick={handleTest}>Test</button>
					<button onClick={handleSend}>Send</button>c
				</div>
			</div>
		</div>
	);
}

export default Chat;
