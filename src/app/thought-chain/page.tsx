'use client';
import React, { useState, useEffect } from 'react';
import * as ooba from '../ooba-api';
import { GenerateParams } from '@/app/ooba-types';
import * as prompts from './prompts';

const params: Partial<GenerateParams> = {
	temperature: 0.01,
	// top_k: 20,
	guidance_scale: 1.25,
	stopping_strings: ['Q:', '\n'],
};

async function runPrompt(
	template: string,
	variables: Record<string, string>,
	extraParams?: Partial<GenerateParams>
) {
	const prompt = template.replace(
		/{{(.*?)}}/g,
		(_, g) => variables[g.trim()] || ''
	);
	console.log(prompt);
	const options = Object.assign({}, params, extraParams, { prompt });
	const response = await ooba.generateText(options);
	const responseText = response.results[0].text;
	// console.log(responseText);
	return responseText;
}

const Phase = ({
	phase,
	outputText,
}: {
	phase: string;
	outputText: string;
}) => (
	<div className="grow text-center pt-12 mx-3 min-h-min">
		<h2>{phase}</h2>
		<textarea
			className="input"
			style={{ height: '100%', width: '90%' }}
			value={outputText}
			readOnly
		/>
	</div>
);

function ThoughtChain() {
	const loadInput = () => {
		const input = localStorage.getItem('thoughtchain-input');
		if (input) setInputText(input);
	};
	useEffect(() => {
		loadInput();
		(window as any).ooba = ooba;
	}, []);

	const [inputText, setInputText] = useState('');

	const [currentPhase, setCurrentPhase] = useState('');
	const [phase1Result, setPhase1Result] = useState('');
	const [phase2Result, setPhase2Result] = useState('');
	const [phase3Result, setPhase3Result] = useState('');
	const [phase4Result, setPhase4Result] = useState('');
	const [phase5Result, setPhase5Result] = useState('');

	useEffect(() => {
		localStorage.setItem('thoughtchain-input', inputText);
	}, [inputText]);

	const handleSend = async (text?: string) => {
		const input = text || inputText;
		if (!input) return;

		try {
			setPhase1Result('');
			setPhase2Result('');
			setPhase3Result('');
			setPhase4Result('');
			setPhase5Result('');
			setInputText(input);
			setCurrentPhase('Phase 1: Expertise Identification');
			const phase1Template = `{{prompts}}\nQ: {{inputText}} A: `;
			const phase1Variables = {
				prompts: prompts.phase1.join('\n'),
				inputText: input,
			};
			const phase1Output = (
				await runPrompt(phase1Template, phase1Variables)
			).trim();
			setPhase1Result(phase1Output);

			setCurrentPhase('Phase 2: In-depth Response');
			const phase2Template = `{{prompts}}\nBased on the fact that """{{phase1Output}}""" Q: {{inputText}} A:`;
			// console.log(phase2Template);
			const phase2Variables = {
				prompts: prompts.phase2.join('\n'),
				inputText: input,
				phase1Output,
			};
			const phase2Output = (
				await runPrompt(phase2Template, phase2Variables, {
					// ban_eos_token: true,
					temperature: 0.25,
				})
			).trim();
			setPhase2Result(phase2Output);

			setCurrentPhase('Phase 3: Accuracy Evaluation');
			const phase3Template = `{{prompts}}\nQ: Evaluate the accuracy of the statement in response to {{inputText}}: {{phase2Output}}. A: `;
			const phase3Variables = {
				prompts: prompts.phase3.join('\n'),
				inputText: input,
				phase2Output,
			};
			const phase3Output = (
				await runPrompt(phase3Template, phase3Variables)
			).trim();
			setPhase3Result(phase3Output);

			setCurrentPhase('Phase 4: Response Revision');
			const phase4Template = `{{prompts}}\nQ: Given the query """{{inputText}}""" and the response """{{response}}""" and the evaluation """{{evaluation}}""", how should the response be revised? If no revision is required, respond with "NO". A: `;
			// const phase4Template = `Q: Given the response """{{response}}""" and the evaluation """{{evaluation}}""", how should the response be revised? A: `;
			const phase4Variables = {
				prompts: prompts.phase4.join('\n'),
				inputText: input,
				response: phase2Output,
				evaluation: phase3Output,
			};
			const phase4Output = (
				await runPrompt(phase4Template, phase4Variables, {
					stopping_strings: ['Q:'],
					guidance_scale: 1.1,
					// temperature: 0.25,
					// top_p: 0.1,
				})
			).trim();
			setPhase4Result(phase4Output);

			if (phase4Output === 'NO') {
				setCurrentPhase('');
				return;
			}

			setCurrentPhase('Phase 5: Response Revision');
			const phase5Template = `{{prompts}}\nQ: Rewrite the response """{{response}}""" using the revision notes """{{revision}}""". A: `;
			const phase5Variables = {
				prompts: prompts.phase5.join('\n'),
				response: phase2Output,
				revision: phase4Output,
			};
			const phase5Output = (
				await runPrompt(phase5Template, phase5Variables, {
					stopping_strings: ['Q:'],
				})
			).trim();
			setPhase5Result(phase5Output);

			// Next: Given the input, response and evaluation, generate how the response should be revised
			// Then given the response and revision instructions, generate the revised response
			// Repeat until the revised response is deemed accurate

			setCurrentPhase('');
		} catch (e) {
			console.error('Error during generation:', e);
			setCurrentPhase('Error occurred. Please try again.');
		}
	};

	return (
		<div>
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
						<button
							onClick={() => {
								const i = Math.round(
									Math.random() * prompts.testPrompts.length
								);
								handleSend(prompts.testPrompts[i]);
							}}
							className="mr-2"
						>
							Test
						</button>
						{currentPhase && <span className="fade">{currentPhase}</span>}
					</div>

					<div
						className="mb-4 flex flex-row flex-wrap pb-5"
						style={{ height: '30em' }}
					>
						<Phase
							phase="Phase 1: Expertise Identification"
							outputText={phase1Result}
						/>
						<Phase
							phase="Phase 2: In-depth Response"
							outputText={phase2Result}
						/>
						<Phase
							phase="Phase 3: Accuracy Evaluation"
							outputText={phase3Result}
						/>
						<Phase
							phase="Phase 4: Revision Needed?"
							outputText={phase4Result}
						/>
						<Phase
							phase="Phase 5: Response Revision"
							outputText={phase5Result}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ThoughtChain;
