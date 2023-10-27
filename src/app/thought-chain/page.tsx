'use client';
import React, { useState, useEffect } from 'react';
import * as ooba from '../ooba-api';
import { GenerateParams } from '@/app/ooba-types';
import * as prompts from './prompts';

type PhaseType = {
	name: string;
	template: string;
	variables: (
		input: string,
		previousResults: Record<string, string>
	) => Record<string, string>;
	extraParams?: Partial<GenerateParams>;
	processOutput?: (output: string) => string;
	shouldStop?: (output: string) => boolean;
};
const phases: PhaseType[] = [
	{
		name: 'Phase 1: Expertise Identification',
		template: `{{prompts}}\nQ: {{inputText}} A: `,
		variables: (input) => ({
			prompts: prompts.phase1.join('\n'),
			inputText: input,
		}),
	},
	{
		name: 'Phase 2: In-depth Response',
		template: `{{prompts}}\nBased on the fact that """{{phase1Output}}""" Q: {{inputText}} A:`,
		variables: (input, previousResults) => ({
			prompts: prompts.phase2.join('\n'),
			inputText: input,
			phase1Output: previousResults['Phase 1: Expertise Identification'],
		}),
		extraParams: {
			temperature: 0.25,
		},
	},
	{
		name: 'Phase 3: Accuracy Evaluation',
		template: `{{prompts}}\nQ: Evaluate the accuracy of the statement in response to {{inputText}}: {{phase2Output}}. A: `,
		variables: (input, previousResults) => ({
			prompts: prompts.phase3.join('\n'),
			inputText: input,
			phase2Output: previousResults['Phase 2: In-depth Response'],
		}),
	},
	{
		name: 'Phase 4: Response Revision',
		// template: `Q: Given the response """{{response}}""" and the evaluation """{{evaluation}}""", how should the response be revised? A: `,
		template: `{{prompts}}\nQ: Given the query """{{inputText}}""" and the response """{{response}}""" and the evaluation """{{evaluation}}""", how should the response be revised? If no revision is required, respond with "NO". A: `,
		variables: (input, previousResults) => ({
			prompts: prompts.phase4.join('\n'),
			inputText: input,
			response: previousResults['Phase 2: In-depth Response'],
			evaluation: previousResults['Phase 3: Accuracy Evaluation'],
		}),
		shouldStop: (output) => output.trim().toUpperCase() === 'NO',
		extraParams: {
			stopping_strings: ['Q:'],
			guidance_scale: 1.1,
		},
	},
	{
		name: 'Phase 5: Response Revision',
		template: `{{prompts}}\nQ: Rewrite the response """{{response}}""" using the revision notes
"""{{revision}}""". A: `,
		variables: (input, previousResults) => ({
			prompts: prompts.phase5.join('\n'),
			response: previousResults['Phase 2: In-depth Response'],
			revision: previousResults['Phase 4: Response Revision'],
		}),
		extraParams: {
			stopping_strings: ['Q:'],
		},
	},
];

const params: Partial<GenerateParams> = {
	temperature: 0.01,
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
	processOutput,
}: {
	phase: string;
	outputText: string;
	processOutput?: (output: string) => string;
}) => (
	<div className="grow text-center pt-12 mx-3 min-h-min">
		<h2>{phase}</h2>
		<textarea
			className="input"
			style={{ height: '100%', width: '90%' }}
			value={processOutput ? processOutput(outputText) : outputText}
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
	const [results, setResults] = useState<Record<string, string>>({});

	const [currentPhase, setCurrentPhase] = useState('');

	useEffect(() => {
		localStorage.setItem('thoughtchain-input', inputText);
	}, [inputText]);

	const handleSend = async (text?: string) => {
		const input = text || inputText;
		if (!input) return;

		try {
			setInputText(input);
			setResults({});
			let newResults = {};
			for (const phase of phases) {
				setCurrentPhase(phase.name);

				const phaseVariables = phase.variables(input, newResults);
				const phaseOutput = (
					await runPrompt(phase.template, phaseVariables, phase.extraParams)
				).trim();

				const processedOutput = phase.processOutput
					? phase.processOutput(phaseOutput)
					: phaseOutput;

				newResults = { ...newResults, [phase.name]: processedOutput };
				setResults(newResults);

				if (phase.shouldStop && phase.shouldStop(processedOutput)) break;
			}
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
				<div className="mt-2 flex flex-row justify-center">
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
					<div className="inline-flex flex-col">
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
				</div>
				<div
					className="mb-4 flex flex-row flex-wrap pb-5"
					style={{ height: '30em' }}
				>
					{phases.map((phase) => (
						<Phase
							key={phase.name}
							phase={phase.name}
							outputText={results[phase.name] || ''}
							processOutput={phase.processOutput}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

export default ThoughtChain;
