'use client';
import '@/styles/fade.css';
import React, { useState, useEffect } from 'react';
import { complete } from '@/lib/llm';

const lsInputKey = 'simpleio-input';
function SimpleIO() {
	const loadInput = () => {
		const input = localStorage.getItem(lsInputKey);
		if (input) setInputText(input);
	};
	useEffect(() => {
		loadInput();
	}, []);

	const [inputText, setInputText] = useState('');
	const [outputText, setOutputText] = useState('');
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
		localStorage.setItem(lsInputKey, inputText);
	}, [inputText]);

	const handleSend = async () => {
		if (!inputText) return;
		const response = await complete(
			{ user: [{ val: inputText }] },
			{ temp: 0.01 }
		);
		setOutputText(response);
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
				value={outputText}
				readOnly
			/>
			<div className="relative">
				<button onClick={handleSend} className="mr-2">
					Send
				</button>
				{showSuccess && <span className="fade">Success</span>}
			</div>
		</div>
	);
}

export default SimpleIO;
