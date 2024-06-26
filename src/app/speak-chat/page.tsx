'use client';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types/llm';
import { generate } from '@/lib/llm';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { MicVAD } from '@ricky0123/vad-web';
import { addMsg, makeMsg } from '@/lib/utils/messages';

function SimpleChat() {
	const vad = () => {
		// @ts-ignore
		return window.vad;
	};
	const [micVadInstance, setMicVadInstance] = useState<any>(null);
	const [micStarted, setMicStarted] = useState<boolean>(false);
	const [inputStr, setInputStr] = useState<string>('');
	const defMsg = makeMsg(
		'message',
		'assistant',
		"Hi, I'm a chatbot. How can I help you today?"
	);
	const [messages, setMessages] = useState<Message[]>([defMsg]);

	const handleSend = async (input = inputStr) => {
		if (!input.trim()) return;

		const userMessage = makeMsg('message', 'user', input);
		const newMessages = addMsg(userMessage, messages, setMessages);

		const response = makeMsg(
			'message',
			'assistant',
			await getAIResponse(input.trim())
		);
		addMsg(response, newMessages, setMessages);
	};

	const getAIResponse = async (input: string) => {
		let messagesStr = messages
			.map((msg) => `${msg.role}: ${msg.content}`)
			.join('\n');
		const lastRole = messages[messages.length - 1].role;
		const role = lastRole === 'user' ? 'assistant' : 'user';
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
		<div className="cha8t-container">
			<ChatBox messages={messages} setMessages={setMessages} />
			<div>
				<button
					className="basic"
					onClick={async () => {
						setMicStarted(!micStarted);
						if (!micStarted && micVadInstance) {
							// @ts-ignore
							micVadInstance.stop();
						} else {
							const v = vad();
							// const micvad = await v.MicVAD.new({
							const micvad = await MicVAD.new({
								onSpeechStart: () => {
									console.log('voice start');
								},
								onSpeechEnd: (audio: any) => {
									// do something with `audio` (Float32Array of audio samples at sample rate 16000)...
									console.log('speech end', audio);
								},
							});
							micvad.start();
							setMicVadInstance(micvad);
						}
						console.log('micvad', micVadInstance);
					}}
				>
					{micStarted ? <FaStop /> : <FaMicrophone />}
				</button>
				<input
					className="input"
					type="text"
					value={inputStr}
					onChange={(e) => setInputStr(e.target.value)}
				/>
				<button className="basic" onClick={() => handleSend()}>
					Send
				</button>
			</div>
		</div>
	);
}

export default SimpleChat;
