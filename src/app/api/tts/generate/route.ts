import { writeFile } from 'fs/promises';
import { NextRequest } from 'next/server';
import { Provider } from '../types';
import * as openai from '../openai';
import * as xtts from '../xtts';

export interface GenerateTTSOptions {
	text: string;
	provider: Provider;
	voice: string;
	/** The name of the file to save on the server. */
	saveAsFile?: string;
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { text, provider, voice, saveAsFile } = body as GenerateTTSOptions;

		let blob: Blob;
		let type = 'audio/wav';
		switch (provider) {
			case 'XTTS': {
				blob = await xtts.generateTTS(text, voice);
				break;
			}
			case 'OpenAI': {
				const apiKey = process.env.OPENAI_API_KEY;
				if (!apiKey) {
					throw new Error('No OpenAI API key found.');
				}
				blob = await openai.generateTTS(text, voice, apiKey);
				type = 'audio/mpeg';
				break;
			}
		}
		if (saveAsFile) {
			const base = '/home/user/ai-experiments-data/';
			const filePath = base + saveAsFile;
			const file = await blob.arrayBuffer();
			await writeFile(filePath, Buffer.from(file));
		}
		console.log(typeof blob);
		return new Response(blob, {
			headers: {
				'Content-Type': type,
			},
		});
	} catch (error) {
		console.error('Error:', error);
		return new Response('TTS Generation failed.', { status: 500 });
	}
}
