import { TextChunk } from '@/app/text-manager/types';
import { encodeTokens, decodeTokens } from '@/lib/llm';
import { v4 } from 'uuid';
import { Message } from './types';

export async function delay(ms = 0): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
export function cors(url: string): string {
	return `http://127.0.0.1:2222/${url}`;
}

export async function chunkText(
	chunk: TextChunk,
	model: string,
	maxTokens: number,
	overlap: number
): Promise<TextChunk[]> {
	const originalContent = chunk.originalContent || (chunk.content as string);
	const tokens = await encodeTokens(originalContent, model);

	// Encode a newline to get its token ID
	const newlineToken = (await encodeTokens('\n', model)).slice(-1)[0];

	let chunks: TextChunk[] = [];
	let start = 0;
	let i = 0;

	while (start < tokens.length) {
		let end = Math.min(start + maxTokens, tokens.length);

		// Adjust end to fall on a newline token
		if (end < tokens.length) {
			let newlineIndex = tokens.lastIndexOf(newlineToken, end - 1);
			if (newlineIndex >= start) {
				end = newlineIndex + 1;
			}
		}

		if (i > 0) {
			// Find the first newline token before the start (within the overlap range)
			let overlapStart = Math.max(0, start - overlap);
			let newlineIndex = tokens.indexOf(newlineToken, overlapStart);
			start = newlineIndex >= 0 && newlineIndex < start ? newlineIndex : start;
		}

		if (start < end) {
			const chunkTokens = tokens.slice(start, end);
			const chunkText = await decodeTokens(chunkTokens, model);
			chunks.push({
				id: v4(),
				title: `${chunk.title} (part ${i++})`,
				content: chunkText.trim(),
				originalContent,
				metadata: {},
			});
		}

		start = end;
	}

	return chunks;
}

export function getMsgBefore(
	messages: Message[],
	test: (msg: Message) => boolean,
	before?: number | Message
): Message | undefined {
	if (before === undefined) before = messages[messages.length - 1];
	if (typeof before !== 'number') {
		before = messages.indexOf(before);
	}
	for (let i = before; i >= 0; i--) {
		if (test(messages[i])) return messages[i];
	}
	return undefined;
}
export function getMsgIndexBefore(
	messages: Message[],
	test: (msg: Message) => boolean,
	before?: number | Message
): number {
	if (before === undefined) before = messages[messages.length - 1];
	if (typeof before !== 'number') {
		before = messages.indexOf(before);
	}
	for (let i = before; i >= 0; i--) {
		if (test(messages[i])) return i;
	}
	return -1;
}
