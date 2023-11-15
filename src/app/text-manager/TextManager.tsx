import React, { useState, useEffect } from 'react';
import { TextChunk } from './types';
import Collapsible from '@/components/Collapsible';
import { v4 } from 'uuid';
import { generate, tokenCount } from '@/lib/llm';
import { makePrompt } from '@/lib/llm/prompts';
import { IoClipboardOutline, IoCloudUploadOutline } from 'react-icons/io5';

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
	const [file, setFile] = useState<File | null>(null);
	const [instructions, setInstructions] = useState<string>(
		'Summarize the provided text under INPUT.'
	);

	useEffect(() => {
		const storedChunks = localStorage.getItem(lsKey);
		const storedInstructions = localStorage.getItem(`${lsKey}-instructions`);
		if (!storedChunks || !storedInstructions) return;
		const parsedChunks = JSON.parse(storedChunks);
		setChunks(parsedChunks);
		setCollapsedChunks(parsedChunks.map((chunk: TextChunk) => chunk.id));
		setInstructions(storedInstructions);

		// any chunks have a content but missing tokenCount?
		//  fetch token count for those chunks and update
		setTimeout(async () => {
			// console.log('fetching token counts', storedChunks);
			const chunksWithContent = JSON.parse(storedChunks).filter(
				(chunk: TextChunk) => chunk.content
			);
			const chunksWithoutTokenCount = chunksWithContent.filter(
				(chunk: TextChunk) => !chunk.metadata?.tokenCount
			);
			if (!chunksWithoutTokenCount.length) return;
			console.log('chunks without token count', chunksWithoutTokenCount);
			for (const chunk of chunksWithoutTokenCount) {
				await fetchTokenCount(chunk, parsedChunks);
				console.log('fetching token count for chunk', chunk);
			}
		}, 1000);
	}, []);

	const summarizeChunk = async (chunkId: string) => {
		const chunkToSummarize = chunks.find((chunk) => chunk.id === chunkId);
		if (!chunkToSummarize || !selectedModel) return;

		const inputText = chunkToSummarize.content;
		const system = instructions;
		const user = 'INPUT:\n```\n' + inputText.trim() + '\n```';
		const format = selectedModel === 'ooba' ? 'ChatML' : 'OpenAI';
		const prompt = makePrompt(user, system, format);

		// TODO how do we get the api key here for non-ooba models?
		//   could mod the llm module to cache and add the key to requests
		const summary = await generate(prompt, {
			model: selectedModel,
			temp: 0.5,
			cfg: 1.1,
		});

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

	const fetchTokenCount = async (chunk: TextChunk, cArr = chunks) => {
		debugger;
		if (!chunk.content) return;
		const count = await tokenCount(chunk.content, selectedModel || 'openai');
		// console.log('token count', count);
		if (!count && chunk.content) return;
		console.log(cArr);
		const updatedChunks = cArr.map((c) => {
			if (c.id === chunk.id) {
				return {
					...c,
					metadata: {
						...c.metadata,
						tokenCount: count,
					},
				};
			}
			return chunk;
		});
		setChunks(updatedChunks);
	};
	const copyChunk = (chunk: TextChunk, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!chunk) return;
		const { title, content } = chunk;
		const text = `${title}\n\n${content}`;
		navigator.clipboard.writeText(text);
	};
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files ? event.target.files[0] : null;
		setFile(file);
	};

	const uploadFile = async () => {
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch('/api/convert-to-text', {
			method: 'POST',
			body: formData,
		});

		const result = await response.json();
		if (result.text) {
			setCurrentContent(result.text);
		}
	};
	const addChunk = () => {
		if (!currentTitle || !currentContent) return;

		const newChunk = {
			id: v4(),
			title: currentTitle,
			content: currentContent,
			metadata: {},
		};

		const updatedChunks = [...chunks, newChunk];
		setChunks(updatedChunks);
		localStorage.setItem(lsKey, JSON.stringify(updatedChunks));
		setCurrentTitle('');
		setCurrentContent('');
		fetchTokenCount(newChunk, updatedChunks);
		setCollapsedChunks([...collapsedChunks, newChunk.id]);
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
					className="font-bold cursor-pointer select-none flex items-center"
					onContextMenu={(e) => {
						e.preventDefault();
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
					<button
						className="basic p-1 green"
						onClick={(e) => copyChunk(chunk, e)}
					>
						<IoClipboardOutline />
					</button>
					{chunk.metadata?.tokenCount && (
						<span title={`${chunk.metadata.tokenCount} tokens`}>
							{chunk.metadata.tokenCount}
						</span>
					)}
				</h3>
				{/* <p className="whitespace-pre-line">{chunk.content}</p> */}
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
				<div className="mb-4">
					<input type="file" onChange={handleFileChange} accept=".txt" />
					<button className="basic ml-2" onClick={uploadFile}>
						<IoCloudUploadOutline />
					</button>
				</div>
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
			<div className="mb-4">
				<textarea
					className="textarea resize-y"
					placeholder="Instructions"
					value={instructions}
					onChange={(e) => setInstructions(e.target.value)}
					onBlur={() => {
						localStorage.setItem(`${lsKey}-instructions`, instructions);
					}}
				/>
			</div>

			<div className="mt-4">{renderChunks()}</div>
		</Collapsible>
	);
}
