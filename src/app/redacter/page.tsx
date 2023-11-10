'use client';
import React, { useState, useEffect } from 'react';
import { withPage } from '@/components/Page';
import { GenerateOptions, generate } from '@/lib/llm';

const title = 'Redacter';

const extraStyles = `
@keyframes fadeInOut {
    0% {opacity: 1;}
    50% {opacity: 0.5;}
    100% {opacity: 0;}
}
.fade {
    animation-name: fadeInOut;
    animation-timing-function: ease-in-out;
    animation-duration: 1s; // Adjust duration as needed
}
`;

const params: GenerateOptions = {
	temp: 0.01,
	cfg: 1.05,
	stop: ['<|im_end|>'],
	top_k: 20,
};
function Redacter() {
	const loadInput = () => {
		const input = localStorage.getItem('redacter-input');
		if (input) setInputText(input);
	};
	useEffect(() => {
		loadInput();
	}, []);

	const [inputText, setInputText] = useState('');
	const [responseText, setResponseText] = useState('');
	const [showSuccess, setShowSuccess] = useState(false);

	useEffect(() => {
		if (showSuccess) {
			const timer = setTimeout(() => {
				setShowSuccess(false);
			}, 900);
			return () => clearTimeout(timer);
		}
	}, [showSuccess]);

	useEffect(() => {
		localStorage.setItem('redacter-input', inputText);
	}, [inputText]);

	const handleSend = async () => {
		if (!inputText) return;
		const prompt = `<|im_start|>system
Given the user's input, remove ANY sensitive or identifying info with [NAME,PHONE,IP,etc], and repeat all other text VERBATIM.
Full Name, Phone/Email/Address/etc, Domain Name, IP, and more<|im_end|>
<|im_start|>user
${inputText}<|im_end|>
<|im_start|>assistant\n`;
		const response = await generate(prompt, Object.assign({}, params));
		console.log('Got response');

		setResponseText(response);
		setShowSuccess(true);
	};

	return (
		<div className="mt-2">
			<textarea
				className="input mr-2"
				style={{ height: '36em', width: '45%' }}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && e.shiftKey) {
						e.preventDefault();
						handleSend();
					}
				}}
				value={inputText}
				onChange={(e) => setInputText(e.target.value)}
				placeholder="Type your message..."
			/>
			<textarea
				className="input mr-2"
				style={{ height: '36em', width: '45%' }}
				value={responseText}
				readOnly
			/>
			<div className="relative">
				<button onClick={() => handleSend()} className="mr-2">
					Send
				</button>
				{showSuccess && <span className="fade">Success</span>}
			</div>
		</div>
	);
}

export default withPage({ title, extraStyles })(Redacter);
