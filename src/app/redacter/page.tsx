'use client';
import React, { useState, useEffect } from 'react';
import * as ooba from '@/app/ooba-api';
import { GenerateParams } from '@/app/ooba-types';

const fadeStyles = `
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

function Redacter() {
	const params: Partial<GenerateParams> = {
		temperature: 0.01,
		top_k: 20,
		guidance_scale: 1.05,
		stopping_strings: ['<|im_end|>'],
	};
	const loadInput = () => {
		const input = localStorage.getItem('redacter-input');
		if (input) setInputText(input);
	};
	useEffect(() => {
		loadInput();
		(window as any).ooba = ooba;
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
		const response = await ooba.generateText(
			Object.assign({}, params, { prompt })
		);
		console.log('Got response');

		setResponseText(response.results[0].text);
		setShowSuccess(true);
	};

	return (
		<div>
			<style>{fadeStyles}</style>
			<h1>Redacter</h1>
			<div>
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
			</div>
		</div>
	);
}

export default Redacter;
