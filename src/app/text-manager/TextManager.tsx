import React, { useState, useEffect } from 'react';
import { TextChunk } from './types';
import Collapsible from '@/components/Collapsible';
import { v4 } from 'uuid';
import { generate, countTokens, getModel } from '@/lib/llm';
import { makePrompt } from '@/lib/llm/prompts';
import { IoClipboardOutline, IoCloudUploadOutline } from 'react-icons/io5';
import { RTFContentObject, RTFObject } from '../api/convert-to-text/route';
import { chunkText } from '@/lib/utils';

const MAX_TOKENS = 768;
const OVERLAP = 128;

const SupportedFileTypes = ['.txt', '.rtf', '.doc', '.docx'];

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
		'Summarize the provided [TYPE] under INPUT.'
	);
	const [isConfirmClear, setIsConfirmClear] = useState(false);

	type ChunkOperation = 'add' | 'update' | 'remove';

	const updateChunks = (operation: ChunkOperation, data?: any, save = true) => {
		let chunksToUse = chunks;
		if (data?.chunks) chunksToUse = data.chunks;
		let updatedChunks = [...chunksToUse];

		switch (operation) {
			case 'add':
				if (data?.chunk) {
					updatedChunks.push(data.chunk);
				}
				break;
			case 'update':
				if (!data?.id || !data?.updates) {
					console.log('missing id or updates', data);
					return;
				}
				updatedChunks = updatedChunks.map((chunk) =>
					chunk.id === data?.id ? { ...chunk, ...data.updates } : chunk
				);
				break;
			case 'remove':
				updatedChunks = updatedChunks.filter(
					(chunk) => data?.id && chunk.id !== data.id
				);
				break;
			default:
				break;
		}

		setChunks(updatedChunks);
		if (!save) return;
		localStorage.setItem(lsKey, JSON.stringify(updatedChunks));
	};

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
			console.log(
				'chunks without token count',
				chunksWithoutTokenCount,
				parsedChunks
			);
			for (const chunk of chunksWithoutTokenCount) {
				const count = await fetchTokenCount(chunk, parsedChunks);
				parsedChunks.map((c: TextChunk) => {
					if (c.id === chunk.id) {
						c.metadata = { ...c.metadata, tokenCount: count };
					}
				});
			}
		}, 1000);
	}, []);

	const clearAllChunks = () => {
		if (isConfirmClear) {
			updateChunks('remove');
			setIsConfirmClear(false);
		} else {
			setIsConfirmClear(true);
			setTimeout(() => setIsConfirmClear(false), 5000);
		}
	};

	const modelFormats = {
		'yarn-mistral-*': 'flexible',
		'*Luna-AI*': 'flexible',
		'dolphin-*-mistral': 'ChatML',
		'TheBloke_dolphin-*-mistral': 'ChatML',
		'neural-chat-*': 'ChatML',
		'emerhyst-*': 'Alpaca',
		openai: 'OpenAI',
		'gpt-*': 'OpenAI',
	};

	const matchesPattern = (modelName: string, pattern: string): boolean => {
		const patternParts = pattern.split('*');
		let lastIndex = 0;

		for (const part of patternParts) {
			if (part === '') continue;
			const index = modelName.indexOf(part, lastIndex);

			if (index === -1) {
				return false;
			}

			lastIndex = index + part.length;
		}

		const isMatch =
			patternParts[patternParts.length - 1] === '' ||
			lastIndex <= modelName.length;
		return isMatch;
	};

	const getModelFormat = (modelName: string): string => {
		for (const pattern in modelFormats) {
			if (matchesPattern(modelName, pattern)) {
				// @ts-ignore
				return modelFormats[pattern];
			}
		}
		return 'flexible';
	};

	const getTextType = async (chunk: TextChunk) => {
		let inputText =
			typeof chunk.content === 'string'
				? chunk.content
				: chunk.originalContent ||
				  chunk.content.map((subChunk) => subChunk.content).join('\n');

		const system = `Provide a general classification for the following text under INPUT. Answer in a few words or less. Examples include: brochure, meeting transcript, etc. Answer should describe the INPUT as generally as possible.`;
		const user = `INPUT:\n${inputText.trim()}\n`;
		const modelName = await getModel(selectedModel || 'openai');
		const format = getModelFormat(modelName);
		console.log(`Using "${modelName}" with format ${format}`);
		const prompt = makePrompt(user, system, format);

		return await generate(prompt, {
			model: selectedModel,
			prefixResponse: `RESPONSE:\nText Category:`,
			stop: ['\n'],
			max: 10,
			temp: 0.2,
			// cfg: 1.05,
			top_p: 0.9,
			top_k: 20,
			min_p: 0.01,
			repetition_penalty: 1.15,
			mirostat_mode: 1,
			// tf
		});
	};
	const getSummary = async (chunk: TextChunk) => {
		let inputText =
			typeof chunk.content === 'string'
				? chunk.content
				: chunk.content.map((subChunk) => subChunk.content).join('\n');

		const type = chunk.detectedType || 'text';
		const system = instructions.replace(/\[TYPE\]/g, type.toLowerCase());
		const user = `INPUT:\n${inputText.trim()}\nEND INPUT`;
		const modelName = await getModel(selectedModel || 'openai');
		const format = getModelFormat(modelName);
		console.log(`Using "${modelName}" with format ${format}`);
		const prompt = makePrompt(user, system, format);

		return await generate(prompt, {
			model: selectedModel,
			prefixResponse: `RESPONSE:\n`,
			max: 919,
			temp: 0.2,
			// cfg: 1.05,
			top_p: 0.9,
			top_k: 20,
			min_p: 0.01,
			repetition_penalty: 1.15,
			mirostat_mode: 1,
			// tf
		});
	};
	const summarizeChunk = async (chunkId: string) => {
		// Find the chunk and its parent (if any)
		let parentChunk = null as TextChunk | null;
		let chunkToSummarize = chunks.find((chunk) => chunk.id === chunkId);

		if (!chunkToSummarize) {
			// Find in subchunks
			for (const chunk of chunks) {
				if (Array.isArray(chunk.content)) {
					const subChunk = chunk.content.find((sub) => sub.id === chunkId);
					if (subChunk) {
						parentChunk = chunk;
						chunkToSummarize = subChunk;
						console.log('found subchunk', subChunk);
						break;
					}
				}
			}
		}

		if (!chunkToSummarize || !selectedModel) return;

		const summary = await getSummary(chunkToSummarize);

		updateChunks('update', {
			id: chunkId,
			updates: { metadata: { ...chunkToSummarize.metadata, summary } },
			chunks: [...chunks],
		});

		// @ts-ignore
		window.reloadChunks && setTimeout(() => window.reloadChunks(), 500);
	};

	const fetchTokenCount = async (chunk: TextChunk, cArr = chunks) => {
		// Check if the chunk has subchunks
		let totalTokenCount = 0;
		if (Array.isArray(chunk.content)) {
			console.log('fetching token count for subchunks', chunk);

			// Iterate over each subchunk to fetch token count
			for (const subChunk of chunk.content) {
				const content = subChunk.content as string;
				if (!content) continue;
				let count = 0;
				if (subChunk.metadata?.tokenCount) {
					count = subChunk.metadata.tokenCount;
				} else {
					count = await countTokens(content, selectedModel || 'openai');
				}
				totalTokenCount += count;

				// Update token count in subchunk metadata
				subChunk.metadata = { ...subChunk.metadata, tokenCount: count };
			}
		} else {
			// Existing logic for single chunks
			let content = chunk.content as string;
			if (!content) return;
			totalTokenCount = await countTokens(content, selectedModel || 'openai');
		}
		updateChunks('update', {
			id: chunk.id,
			updates: { metadata: { ...chunk.metadata, tokenCount: totalTokenCount } },
			chunks: cArr,
		});
		return totalTokenCount;
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
		// does chunk have a title? if not, use the file name
		if (!currentTitle) {
			const fileName = file.name.split('.')[0];
			setCurrentTitle(fileName);
		}

		const response = await fetch('/api/convert-to-text', {
			method: 'POST',
			body: formData,
		});

		interface Response {
			convertedText: string | (RTFObject | RTFContentObject)[];
			type: string;
		}
		const result: Response = await response.json();
		switch (result.type) {
			case 'string':
				setCurrentContent(result.convertedText as string);
				break;
			case 'rtf':
				const content = (result.convertedText as RTFObject[])
					.map((obj) => {
						if ('content' in obj) {
							return obj.content.map((c) => c.value).join('');
						} else {
							return (obj as RTFContentObject).value;
						}
					})
					.join('\n');
				setCurrentContent(content);
				break;
			case 'test':
				console.log('test format', result.convertedText);
				break;
			default:
				console.log('unknown file type', result.type);
				break;
		}
	};
	const processAndAddChunk = async (title: string, content: string) => {
		const tokenCount = await countTokens(content, selectedModel || 'openai');
		if (tokenCount > MAX_TOKENS) {
			let updatedChunks = [...chunks];
			const splittedChunks = await chunkText(
				{ id: v4(), title, content, metadata: {} },
				selectedModel || 'openai',
				MAX_TOKENS,
				OVERLAP
			);
			splittedChunks.forEach((chunk) => {
				updateChunks('add', { chunk, chunks: updatedChunks });
				updatedChunks.push(chunk);
			});
		} else {
			// try to get text type
			const textType = await getTextType({
				id: '',
				title,
				content,
				metadata: {},
			});
			const newChunk: TextChunk = {
				id: v4(),
				title,
				content,
				detectedType: textType?.trim() || '',
				metadata: { tokenCount },
			};
			updateChunks('add', { chunk: newChunk });
			console.log('added chunk', newChunk);
		}
	};

	const addChunk = () => {
		if (!currentTitle || !currentContent) {
			// convenience: upload file if no title or content but file is present
			if (file) {
				uploadFile();
				setTimeout(() => {
					addChunk();
				}, 150);
			}
			return;
		}
		processAndAddChunk(currentTitle, currentContent);
		setCurrentTitle('');
		setCurrentContent('');
		setFile(null);
	};
	const removeChunk = (id: string) => {
		updateChunks('remove', { id });
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
					{chunk.detectedType && (
						<span className="ml-1 text-sm text-gray-500">
							({chunk.detectedType})
						</span>
					)}
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
					<div className="whitespace-pre-line">
						{typeof chunk.content === 'string' ? (
							<p>{chunk.content}</p>
						) : (
							chunk.content.map((subChunk) => (
								<p key={subChunk.id} title={subChunk.title}>
									{subChunk.content as string}
								</p>
							))
						)}
					</div>
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
					<input
						type="file"
						onChange={handleFileChange}
						accept={SupportedFileTypes.join(',')}
					/>
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

			<div className="mt-4">
				{chunks.length > 0 && (
					<button className="delete" onClick={clearAllChunks}>
						{isConfirmClear ? 'Confirm?' : 'Clear All'}
					</button>
				)}
				{renderChunks()}
			</div>
		</Collapsible>
	);
}
