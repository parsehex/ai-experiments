'use client';
import React, { useState, useEffect } from 'react';
import * as ooba from '../ooba-api';
import { GenerateParams } from '@/app/ooba-types';
import * as prompts from './prompts';

const fadeStyles = `
@keyframes fadeInOut {
    0% {opacity: 1;}
    50% {opacity: 0.5;}
    100% {opacity: 0;}
}
.fade {
    animation-name: fadeInOut;
    animation-timing-function: ease-in-out;
    animation-duration: 1s;
}
`;

function ThoughtChain() {
	const params: Partial<GenerateParams> = {
		temperature: 0.01,
		top_k: 20,
		guidance_scale: 1.05,
		stopping_strings: ['Q:', '\n'],
	};
	const loadInput = () => {
		const input = localStorage.getItem('thoughtchain-input');
		if (input) setInputText(input);
	};
	useEffect(() => {
		loadInput();
		(window as any).ooba = ooba;
	}, []);

	const [inputText, setInputText] = useState('');
	const [responseText, setResponseText] = useState('');
	const [showSuccess, setShowSuccess] = useState(false);

	const [phase1Result, setPhase1Result] = useState('');
	const [phase2Result, setPhase2Result] = useState('');
	const [phase3Result, setPhase3Result] = useState('');

	useEffect(() => {
		if (showSuccess) {
			const timer = setTimeout(() => {
				setShowSuccess(false);
			}, 900);

			return () => clearTimeout(timer);
		}
	}, [showSuccess]);

	useEffect(() => {
		localStorage.setItem('thoughtchain-input', inputText);
	}, [inputText]);

	// 	const handleSend = async () => {
	// 		if (!inputText) return;
	// 		const prompt = `<|im_start|>system
	// Given the user's input, remove ANY sensitive or identifying info with [NAME,PHONE,IP,etc], and repeat all other text VERBATIM.
	// Full Name, Phone/Email/Address/etc, Domain Name, IP, and more<|im_end|>
	// <|im_start|>user
	// ${inputText}<|im_end|>
	// <|im_start|>assistant\n`;
	// 		const response = await ooba.generateText(
	// 			Object.assign({}, params, { prompt })
	// 		);
	// 		console.log('Got response');

	// 		setResponseText(response.results[0].text);
	// 		setShowSuccess(true);
	// 	};
	const handleSend = async () => {
		if (!inputText) return;

		// Phase 1: Expertise Identification
		const phase1Prompt = `${prompts.phase1.join('\n')}\nQ: ${inputText} A: `;
		const phase1Response = await ooba.generateText(
			Object.assign({}, params, { prompt: phase1Prompt })
		);
		const p1ResponseText = phase1Response.results[0].text;
		// console.log(p1ResponseText);
		let phase1Output = p1ResponseText.split('\n').pop()?.split('A: ')[1] || '';
		if (!phase1Output && p1ResponseText && !p1ResponseText.includes('A:'))
			phase1Output = p1ResponseText.trim();
		setPhase1Result(phase1Output);

		// Phase 2: In-depth Response
		const phase2Prompt = `${prompts.phase2.join(
			'\n'
		)}\n Based on the fact that ${phase1Output}, Q: ${inputText}? A: `;
		const phase2Response = await ooba.generateText(
			Object.assign({}, params, { prompt: phase2Prompt })
		);
		const p2ResponseText = phase2Response.results[0].text;
		let phase2Output = p2ResponseText.split('\n').pop()?.split('A: ')[1] || '';
		if (!phase2Output && p2ResponseText && !p2ResponseText.includes('A:'))
			phase2Output = p2ResponseText.trim();
		setPhase2Result(phase2Output);

		// Phase 3: Accuracy Evaluation
		const phase3Prompt = `${prompts.phase3.join(
			'\n'
		)}\nQ: Evaluate the accuracy of the statement in response to ${inputText}: ${phase2Output}. A: `;
		const phase3Response = await ooba.generateText(
			Object.assign({}, params, { prompt: phase3Prompt })
		);
		const p3ResponseText = phase3Response.results[0].text;
		let phase3Output = p3ResponseText.split('\n').pop()?.split('A: ')[1] || '';
		if (!phase3Output && p3ResponseText && !p3ResponseText.includes('A:'))
			phase3Output = p3ResponseText.trim();
		setPhase3Result(phase3Output);

		// Next: Given the input, response and evaluation, generate how the response should be revised
		// Then given the response and revision instructions, generate the revised response
		// Repeat until the revised response is deemed accurate

		setShowSuccess(true);
	};

	return (
		<div>
			<style>{fadeStyles}</style>
			<h1>Thought Chain</h1>
			<div>
				<div className="mt-2">
					<textarea
						className="input mr-2"
						style={{ height: '6em', width: '45%' }}
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
					<div className="relative">
						<button onClick={() => handleSend()} className="mr-2">
							Send
						</button>
						{showSuccess && <span className="fade">Success</span>}
					</div>

					<div
						className="my-4 flex flex-row flex-auto pb-5"
						style={{ height: '30em' }}
					>
						<div className="grow text-center">
							<h2>Phase 1: Expertise Identification</h2>
							<textarea
								className="input"
								style={{ height: '100%', width: '90%' }}
								value={phase1Result}
								readOnly
							/>
						</div>
						<div className="grow text-center">
							<h2>Phase 2: In-depth Response</h2>
							<textarea
								className="input"
								style={{ height: '100%', width: '90%' }}
								value={phase2Result}
								readOnly
							/>
						</div>
						<div className="grow text-center">
							<h2>Phase 3: Accuracy Evaluation</h2>
							<textarea
								className="input"
								style={{ height: '100%', width: '90%' }}
								value={phase3Result}
								readOnly
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ThoughtChain;
