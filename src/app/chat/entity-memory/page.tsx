'use client';
import React, { useState, useEffect } from 'react';
import {
	AgentExecutor,
	initializeAgentExecutorWithOptions,
} from 'langchain/agents';
import { getLLM } from '../../llms';
import { StructuredTool, Tool } from 'langchain/tools';
import { Serialized } from 'langchain/load/serializable';
import { testPrompts } from './prompts';
import { EntityMemory } from 'langchain/memory';
import { ChatBox } from '@/app/components/ChatBox';
import { Message } from '@/app/types';

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
	const [executor, setExecutor] = useState(null as AgentExecutor | null);
	const [entities, setEntities] = useState({});

	const handleLLMStart = (llm: Serialized, ...args: any[]) => {
		console.log('llm start', llm, args);
	};

	useEffect(() => {
		fetch('/api/api-keys').then(async (res) => {
			const { OPENAI_API_KEY, GOOGLE_API_KEY, GOOGLE_CSE_ID } =
				await res.json();
			const lsOpenaiKey =
				window.localStorage.getItem('openaiKey') || OPENAI_API_KEY || '';

			setOpenaiKey(lsOpenaiKey);
		});
	}, []);

	useEffect(() => {
		if (!openaiKey) return;
		const initializeExecutor = async () => {
			const tools: Tool[] = [];
			const memory = new EntityMemory({
				llm: getLLM('gpt3', openaiKey),
				inputKey: 'input',
				outputKey: 'chat_history',
			});
			const createdExecutor = await initializeAgentExecutorWithOptions(
				tools,
				getLLM('gpt35', openaiKey),
				{
					agentType: 'chat-conversational-react-description',
					// verbose: true,
					returnIntermediateSteps: true,
					callbacks: [{ handleLLMStart }],
					memory,
				}
			);
			setMessages([]);
			setExecutor(createdExecutor);
		};

		initializeExecutor();
	}, [openaiKey]);

	const handleSend = async () => {
		if (!executor) return;
		const userInput = input;
		setInput('');

		setMessages([
			...messages,
			{ role: 'user', content: userInput },
		] as Message[]);

		const result = await executor.call({ input: userInput }, [
			{
				handleChainStart: (...args) => console.log('chain start', args),
				handleLLMStart: (...args) => console.log('llm start', args),
			},
		]);
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

		const newEntities = await executor.memory?.loadMemoryVariables({
			input: '',
		});
		setEntities(newEntities || {});
	};

	const handleTest = async () => {
		setInput(testPrompts[Math.floor(Math.random() * testPrompts.length)]);
		handleSend();
	};

	return (
		<div>
			<h1>Chat - Entity Memory</h1>
			<input
				value={openaiKey}
				className="input"
				onChange={(e) => {
					setOpenaiKey(e.target.value);
					localStorage.setItem('openaiKey', e.target.value);
				}}
				placeholder="OpenAI key..."
			/>
			<div className="container">
				<ChatBox
					messages={messages}
					setMessages={setMessages}
					roles={['user', 'assistant', 'assistant-thinking']}
				/>
				<div className="entityBox">
					<h2>Entities Recognized</h2>
					{Object.keys(entities).map((entity) => (
						<div key={entity} className="entityItem">
							{/* @ts-ignore */}
							<strong>{entity}</strong>: {entities[entity]}
							{/* Add buttons here to edit or delete the entity if needed */}
						</div>
					))}
				</div>
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
					<button onClick={handleSend}>Send</button>
				</div>
			</div>
		</div>
	);
}

export default Chat;
