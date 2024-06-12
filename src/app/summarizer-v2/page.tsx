'use client';

// new notes
// same basic idea: generate summary from a block of text
// same problems: how to split the text into chunks, how to generate the summaries
//   and on the user side: summaries of text can be lacking since information is lost
// new idea: add tooltips to the generated summary with additional context

import React, { useState, useEffect } from 'react';
import { GenerateOptions, complete } from '@/lib/llm';
import TextManager from '../text-manager/TextManager';
import { listModels } from '@/lib/llm/openai-api';
// import { makePrompt } from '@/lib/llm/prompts';
import { TextChunk } from '../text-manager/types';
import { IoReloadOutline, IoStopSharp } from 'react-icons/io5';
import { stopStream } from '@/lib/llm/ooba-api.new';
import Collapsible from '@/components/Collapsible';
import { PromptFormatResponse, PromptPartResponse } from '@/lib/types/llm';
import AIModelStatus from '@/components/AIModelStatus';

const lsKey = 'textSummarizationChunks';

function Summarizer() {
	const [apiKey, setApiKey] = useState('');
	const [selectedModel, setSelectedModel] = useState('ooba');
	const [availableModels, setAvailableModels] = useState<string[]>(['ooba']);
	const [collapsedChunks, setCollapsedChunks] = useState<string[]>([]);
	const [chunks, setChunks] = useState<TextChunk[]>([]);

	const reloadChunks = () => {
		const storedChunks = localStorage.getItem(lsKey);
		if (storedChunks) {
			setChunks(JSON.parse(storedChunks));
			setCollapsedChunks(
				JSON.parse(storedChunks).map((chunk: TextChunk) => chunk.id)
			);
		}
	};

	useEffect(() => {
		reloadChunks();
		// @ts-ignore
		window.reloadChunks = reloadChunks;

		fetch('/api/api-keys')
			.then(async (res) => {
				const { OPENAI_API_KEY } = await res.json();
				if (!OPENAI_API_KEY) return;
				setApiKey(OPENAI_API_KEY);
				return listModels(OPENAI_API_KEY);
			})
			.then((models) => {
				if (!models) return;
				console.log(models);
				// remove any that dont start with gpt
				models = models.filter((model) => model.id.startsWith('gpt'));
				const modelNames = models.map((model) => model.id);
				modelNames.unshift('ooba');
				setAvailableModels(modelNames);
			});
	}, []);

	// const constructPrompt = (inputText?: string) => {
	// 	if (!inputText) inputText = testInput;
	// 	const system = `Summarize the provided text under INPUT.`;
	// 	const user = 'INPUT:\n```\n' + inputText.trim() + '\n```';
	// 	const format = selectedModel === 'ooba' ? 'flexible' : 'OpenAI';
	// 	const prompt = makePrompt(user, system, format);
	// 	return prompt;
	// };

	// const Test = async () => {
	// 	const prompt = constructPrompt();
	// 	console.log(prompt);
	// 	const options: GenerateOptions = {
	// 		model: selectedModel,
	// 		api_key: apiKey,
	// 	};
	// 	const result = await generate(prompt, options);
	// 	console.log(result);
	// 	setOutput(result);
	// };

	const [systemPrompt, setSystemPrompt] = useState(
		'Summarize the provided text under INPUT.\nImportant: Highlight words/phrases of the summary that would benefit from a tooltip providing additional context. Enclose these sections in double curly braces (e.g. {{additional context}}).'
	);
	const [inputText, setInputText] = useState(
		'INPUT:\nStable Diffusion is a deep learning, text-to-image model released in 2022 based on diffusion techniques. It is considered to be a part of the ongoing AI boom.\n\nIt is primarily used to generate detailed images conditioned on text descriptions, though it can also be applied to other tasks such as inpainting, outpainting, and generating image-to-image translations guided by a text prompt.[3] Its development involved researchers from the CompVis Group at Ludwig Maximilian University of Munich and Runway with a computational donation by Stability AI and training data from non-profit organizations.[4][5][6][7]\n\nStable Diffusion is a latent diffusion model, a kind of deep generative artificial neural network. Its code and model weights have been open sourced,[8] and it can run on most consumer hardware equipped with a modest GPU with at least 4 GB VRAM. This marked a departure from previous proprietary text-to-image models such as DALL-E and Midjourney which were accessible only via cloud services.[9][10]'
	);
	const [output, setOutput] = useState('');

	const lsKey = 'summarize-';
	useEffect(() => {
		const storedSystemPrompt = localStorage.getItem(lsKey + 'system');
		if (storedSystemPrompt) setSystemPrompt(storedSystemPrompt);
		const storedInputText = localStorage.getItem(lsKey + 'input');
		if (storedInputText) setInputText(storedInputText);
	}, []);
	useEffect(() => {
		localStorage.setItem(lsKey + 'system', systemPrompt);
		localStorage.setItem(lsKey + 'input', inputText);
	}, [systemPrompt, inputText]);

	const handleGenerateSummary = async () => {
		const fmt: PromptPartResponse = {
			system: [{ val: systemPrompt }],
			user: [{ val: inputText }],
			// prefix_response: 'RESPONSE:\n',
		};
		const result = await complete(fmt, {
			temp: 0.25,
			max: 512,
			repeat_pen: 1.19,
			// stop: ['|im_end|>', '<|im_end|>', '>!'],
		});
		console.log(result);
		setOutput(result);
	};

	// add computed var for summary size

	return (
		<div className="mt-2 flex">
			<AIModelStatus type="llm" />
			<Collapsible className="grow" title="Simple Summary">
				<p>TODO</p>
				<label className="font-bold text-xs">
					System Prompt
					<textarea
						className="w-full input"
						value={systemPrompt}
						onChange={(e) => setSystemPrompt(e.target.value)}
					/>
				</label>
				<label className="font-bold text-xs">
					Input Text
					<textarea
						className="w-full input"
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
					/>
				</label>
				<button
					className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold p-1 rounded"
					onClick={handleGenerateSummary}
				>
					Generate
				</button>
				{output && (
					<span>
						Summary: {output.length} vs {inputText.length} original
					</span>
				)}
				<p className="whitespace-pre-line">{output}</p>
			</Collapsible>
		</div>
	);
}

export default Summarizer;
