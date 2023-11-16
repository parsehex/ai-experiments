import React, { useState, useEffect } from 'react';
import { TextChunk } from './types';
import Collapsible from '@/components/Collapsible';
import { v4 } from 'uuid';
import { generate, countTokens } from '@/lib/llm';
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
			console.log(
				'chunks without token count',
				chunksWithoutTokenCount,
				parsedChunks
			);
			for (const chunk of chunksWithoutTokenCount) {
				await fetchTokenCount(chunk, parsedChunks);
			}
		}, 1000);
	}, []);

	const getSummary = async (chunk: TextChunk) => {
		let inputText =
			typeof chunk.content === 'string'
				? chunk.content
				: chunk.content.map((subChunk) => subChunk.content).join('\n');

		const system = instructions;
		const user = `INPUT:\nTitle: \`${
			chunk.title
		}\`\nContent: \`\`\`\n${inputText.trim()}\n\`\`\``;
		const format = selectedModel === 'ooba' ? 'ChatML' : 'OpenAI';
		const prompt = makePrompt(user, system, format);

		return await generate(prompt, {
			model: selectedModel,
			temp: 0.75,
			cfg: 1.05,
			top_p: 1,
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

		// Update state for both top-level chunks and subchunks
		setChunks(
			chunks.map((chunk) => {
				if (chunk.id === chunkId) {
					return { ...chunk, metadata: { ...chunk.metadata, summary } };
				} else if (parentChunk && chunk.id === parentChunk.id) {
					return {
						...chunk,
						content: (chunk.content as TextChunk[]).map((subChunk) => {
							return subChunk.id === chunkId
								? { ...subChunk, metadata: { ...subChunk.metadata, summary } }
								: subChunk;
						}),
					};
				}
				return chunk;
			})
		);

		// Update localStorage and reload chunks if necessary
		localStorage.setItem(lsKey, JSON.stringify(chunks));
		// @ts-ignore
		window.reloadChunks && setTimeout(() => window.reloadChunks(), 500);
	};

	const fetchTokenCount = async (chunk: TextChunk, cArr = chunks) => {
		// Check if the chunk has subchunks
		if (Array.isArray(chunk.content)) {
			console.log('fetching token count for subchunks', chunk);
			let totalTokenCount = 0;

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

			// Update the parent chunk with total token count
			const updatedChunks = cArr.map((c) => {
				if (c.id === chunk.id) {
					return {
						...c,
						metadata: { ...c.metadata, tokenCount: totalTokenCount },
					};
				}
				return c;
			});

			setChunks(updatedChunks);
			localStorage.setItem(lsKey, JSON.stringify(updatedChunks));
		} else {
			// Existing logic for single chunks
			let content = chunk.content as string;
			if (!content) return;
			const count = await countTokens(content, selectedModel || 'openai');

			const updatedChunks = cArr.map((c) => {
				if (c.id === chunk.id) {
					return {
						...c,
						metadata: { ...c.metadata, tokenCount: count },
					};
				}
				return c;
			});

			setChunks(updatedChunks);
			localStorage.setItem(lsKey, JSON.stringify(updatedChunks));
		}
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
			console.log('chunking text', content);
			const splittedChunks = await chunkText(
				{ id: v4(), title, content, metadata: {} },
				selectedModel || 'openai',
				MAX_TOKENS,
				OVERLAP
			);
			setChunks([...chunks, ...splittedChunks]);
		} else {
			const newChunk = {
				id: v4(),
				title,
				content,
				metadata: { tokenCount },
			};
			setChunks([...chunks, newChunk]);
		}
	};

	const addChunk = () => {
		if (!currentTitle || !currentContent) return;
		processAndAddChunk(currentTitle, currentContent);
		setCurrentTitle('');
		setCurrentContent('');
		setFile(null);
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

			<div className="mt-4">{renderChunks()}</div>
		</Collapsible>
	);
}
