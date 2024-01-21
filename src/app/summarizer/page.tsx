'use client';
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

	const [systemPrompt, setSystemPrompt] = useState('');
	const [inputText, setInputText] = useState('');
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

	const SimpleSummaryForm = () => {
		// TODO
		// a simpler form to summarize text standalone
		// has a box for System Prompt/Instructions & Input Text
		// + button to generate the output
		// output is displayed below
		return (
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
					onClick={async () => {
						const fmt: PromptPartResponse = {
							system: [{ val: systemPrompt }],
							user: [{ val: inputText }],
							prefix_response: 'RESPONSE:\n',
						};
						const result = await complete(fmt, {
							temp: 0.75,
							max: 512,
							repeat_pen: 1.19,
							stop: ['|im_end|>', '<|im_end|>', '>!'],
						});
						console.log(result);
						setOutput(result);
					}}
				>
					Generate
				</button>
				<span className="whitespace-pre-line">{output}</span>
			</Collapsible>
		);
	};

	const renderSummary = (chunk: TextChunk, chunkTitle: string) => {
		return (
			<div key={chunk.id} className="p-4 border-b border-gray-300">
				<h3
					className="font-bold"
					onContextMenu={(e) => {
						e.preventDefault();
						const thisChunk = chunks.find((c) => c.id === chunk.id);
						if (!thisChunk) return;
						const updatedChunks = chunks.map((c) => {
							if (c.id !== thisChunk.id) return c;
							return {
								...c,
								metadata: {
									...c.metadata,
									summary: '',
								},
							};
						});
						setChunks(updatedChunks);
						localStorage.setItem(lsKey, JSON.stringify(updatedChunks));
					}}
					onClick={() => {
						const newCollapsedChunks = collapsedChunks.includes(chunk.id)
							? collapsedChunks.filter((id) => id !== chunk.id)
							: [...collapsedChunks, chunk.id];
						setCollapsedChunks(newCollapsedChunks);
					}}
				>
					{chunkTitle}
					{collapsedChunks.includes(chunk.id) ? ' ▶' : ' ▼'}
				</h3>
				{!collapsedChunks.includes(chunk.id) && chunk.metadata?.summary && (
					<p className="whitespace-pre-line">{chunk.metadata.summary}</p>
				)}
			</div>
		);
	};

	const renderSummaries = () => {
		return chunks.flatMap((chunk) => {
			if (Array.isArray(chunk.content)) {
				return chunk.content.map(
					(subChunk, index) =>
						subChunk.metadata?.summary &&
						renderSummary(subChunk, `${chunk.title} (part ${index})`)
				);
			} else {
				return (
					chunk.metadata?.summary &&
					renderSummary(chunk, chunk.title + ' - Summary')
				);
			}
		});
	};

	return (
		<div className="mt-2 flex">
			<AIModelStatus type="llm" />
			<div className="border-r border-gray-300 pr-4 max-w-1/3">
				<TextManager selectedModel={selectedModel} lsKey={lsKey} />A
			</div>
			<div className="ml-4 grow">
				<label className="font-bold text-xs">Model</label>
				<select
					id="model"
					value={selectedModel}
					onChange={(e) => setSelectedModel(e.target.value)}
				>
					{availableModels.map((model) => (
						<option key={model} value={model}>
							{model}
						</option>
					))}
				</select>
				{selectedModel === 'ooba' && (
					<button
						className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold p-1 rounded"
						onClick={() => stopStream()}
					>
						<IoStopSharp />
					</button>
				)}
				<h2 className="font-bold text-lg">
					Summaries
					<button
						className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold p-1 rounded"
						onClick={reloadChunks}
					>
						<IoReloadOutline />
					</button>
				</h2>
				{renderSummaries()}
			</div>
			{SimpleSummaryForm()}
		</div>
	);
}

export default Summarizer;
