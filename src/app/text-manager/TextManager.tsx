import React, { useState, useEffect } from 'react';
import { TextChunk } from './types';
import Collapsible from '@/components/Collapsible';
import { v4 } from 'uuid';
import { generate } from '@/lib/llm';
import { makePrompt } from '@/lib/llm/prompts';

interface TextManagerProps {
	selectedModel?: string;
	lsKey: string;
}

export default function TextManager({
	selectedModel,
	lsKey,
}: TextManagerProps) {
	const [chunks, setChunks] = useState<TextChunk[]>([]);
	const [currentTitle, setCurrentTitle] = useState('');
	const [currentContent, setCurrentContent] = useState('');
	const [collapsedChunks, setCollapsedChunks] = useState<string[]>([]);

	useEffect(() => {
		const storedChunks = localStorage.getItem(lsKey);
		if (storedChunks) {
			setChunks(JSON.parse(storedChunks));
		}
	}, []);

	const summarizeChunk = async (chunkId: string) => {
		const chunkToSummarize = chunks.find((chunk) => chunk.id === chunkId);
		if (!chunkToSummarize || !selectedModel) return;

		const inputText = chunkToSummarize.content;
		const system = `Summarize the provided text under INPUT.`;
		const user = 'INPUT:\n```\n' + inputText.trim() + '\n```';
		const format = selectedModel === 'ooba' ? 'flexible' : 'OpenAI';
		const prompt = makePrompt(user, system, format);

		// TODO how do we get the api key here for non-ooba models?
		//   could mod the llm module to cache and add the key to requests
		const summary = await generate(prompt, { model: selectedModel });

		const updatedChunks = chunks.map((chunk) => {
			if (chunk.id === chunkId) {
				return {
					...chunk,
					metadata: {
						...chunk.metadata,
						summary,
					},
				};
			}
			return chunk;
		});

		setChunks(updatedChunks);
		localStorage.setItem(lsKey, JSON.stringify(updatedChunks));

		// if window has a "reloadChunks" function, call it after a timeout
		// @ts-ignore
		if (window.reloadChunks) {
			setTimeout(() => {
				// @ts-ignore
				window.reloadChunks();
			}, 500);
		}
	};

	const addChunk = () => {
		if (!currentTitle || !currentContent) return;

		const newChunk = {
			id: v4(),
			title: currentTitle,
			content: currentContent,
		};

		const updatedChunks = [...chunks, newChunk];
		setChunks(updatedChunks);
		localStorage.setItem(lsKey, JSON.stringify(updatedChunks));
		setCurrentTitle('');
		setCurrentContent('');
	};
	const removeChunk = (id: string) => {
		const updatedChunks = chunks.filter((chunk) => chunk.id !== id);
		setChunks(updatedChunks);
		localStorage.setItem(lsKey, JSON.stringify(updatedChunks));
	};

	const renderChunks = () => {
		return chunks.map((chunk) => (
			<div key={chunk.id} className="p-4 border-b border-gray-300">
				<h3
					className="font-bold cursor-pointer select-none"
					onContextMenu={() => {
						removeChunk(chunk.id);
					}}
					onClick={() => {
						if (collapsedChunks.includes(chunk.id)) {
							setCollapsedChunks(
								collapsedChunks.filter((id) => id !== chunk.id)
							);
						} else {
							setCollapsedChunks([...collapsedChunks, chunk.id]);
						}
					}}
				>
					{chunk.title}
					<span className="ml-1">
						{collapsedChunks.includes(chunk.id) ? '►' : '▼'}
					</span>
					<button
						className="basic ml-2"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							summarizeChunk(chunk.id);
						}}
					>
						Summarize
					</button>
				</h3>
				{!collapsedChunks.includes(chunk.id) && (
					<p className="whitespace-pre-line">{chunk.content}</p>
				)}
			</div>
		));
	};

	return (
		<Collapsible title="Text Chunks" titleSize="md">
			<div className="mb-4 flex flex-col">
				<input
					type="text"
					className="input mr-2"
					placeholder="Chunk Title"
					value={currentTitle}
					onChange={(e) => setCurrentTitle(e.target.value)}
				/>
				<textarea
					className="textarea resize-y"
					placeholder="Content"
					value={currentContent}
					onChange={(e) => setCurrentContent(e.target.value)}
				/>
			</div>
			<button className="basic" onClick={addChunk}>
				Add Chunk
			</button>
			<div className="mt-4">{renderChunks()}</div>
		</Collapsible>
	);
}
