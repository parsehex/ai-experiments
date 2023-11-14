'use client';
import React, { useState, useEffect } from 'react';
import { withPage } from '@/components/Page';
import { GenerateOptions, generate } from '@/lib/llm';
import TextManager from '../text-manager/TextManager';
import { listModels } from '@/lib/llm/openai-api';
import { makePrompt } from '@/lib/llm/prompts';
import { TextChunk } from '../text-manager/types';
import { IoReloadOutline } from 'react-icons/io5';

const title = 'Summarizer';
const lsKey = 'textSummarizationChunks';

function Summarizer() {
	const [apiKey, setApiKey] = useState('');
	const [selectedModel, setSelectedModel] = useState('ooba');
	const [availableModels, setAvailableModels] = useState<string[]>(['ooba']);
	const [testInput, setTestInput] = useState('');
	const [output, setOutput] = useState('');
	const [chunks, setChunks] = useState<TextChunk[]>([]);

	const reloadChunks = () => {
		const storedChunks = localStorage.getItem(lsKey);
		if (storedChunks) {
			setChunks(JSON.parse(storedChunks));
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

	const constructPrompt = (inputText?: string) => {
		if (!inputText) inputText = testInput;
		const system = `Summarize the provided text under INPUT.`;
		const user = 'INPUT:\n```\n' + inputText.trim() + '\n```';
		const format = selectedModel === 'ooba' ? 'flexible' : 'OpenAI';
		const prompt = makePrompt(user, system, format);
		return prompt;
	};

	const Test = async () => {
		const prompt = constructPrompt();
		console.log(prompt);
		const options: GenerateOptions = {
			model: selectedModel,
			api_key: apiKey,
		};
		const result = await generate(prompt, options);
		console.log(result);
		setOutput(result);
	};

	const renderSummaries = () => {
		return chunks.map(
			(chunk) =>
				chunk.metadata?.summary && (
					<div key={chunk.id} className="p-4 border-b border-gray-300">
						<h3 className="font-bold">{chunk.title} - Summary</h3>
						<p className="whitespace-pre-line">{chunk.metadata.summary}</p>
					</div>
				)
		);
	};

	return (
		<div className="mt-2 flex">
			<div className="w-2/3">
				<TextManager selectedModel={selectedModel} lsKey={lsKey} />
			</div>
			<div className="ml-4">
				<select
					value={selectedModel}
					onChange={(e) => setSelectedModel(e.target.value)}
				>
					{availableModels.map((model) => (
						<option key={model} value={model}>
							{model}
						</option>
					))}
				</select>
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
		</div>
	);
}

export default withPage({ title })(Summarizer);
