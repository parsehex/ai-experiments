import { TextChunk } from '@/app/text-manager/types';
import { encodeTokens, decodeTokens } from '@/lib/llm';
import { v4 } from 'uuid';

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
	// TODO avoid splitting in the middle of a sentence/line
	const originalContent = chunk.originalContent || (chunk.content as string);
	const tokens = await encodeTokens(originalContent, model);
	let chunks: TextChunk[] = [];
	let start = 0;
	let i = 0;

	while (start < tokens.length) {
		let end = Math.min(start + maxTokens, tokens.length);
		if (end < tokens.length) {
			// Move the end back to achieve overlap
			end -= overlap;
		}
		const chunkTokens = tokens.slice(start, end);
		const chunkText = await decodeTokens(chunkTokens, model);
		chunks.push({
			id: v4(),
			title: `${chunk.title} (part ${i++})`,
			content: chunkText,
			originalContent,
			metadata: {},
		});
		start = end;
	}
	return chunks;
}
