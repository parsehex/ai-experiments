import { readFile } from 'fs/promises';
import { NextRequest } from 'next/server';
import { Provider } from '../types';
import mimetype from 'mime-types';

export interface PlayTTSOptions {
	filename: string;
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { filename } = body as PlayTTSOptions;
		const base = '/home/user/ai-experiments-data/';
		const filePath = base + filename;
		const file = await readFile(filePath);
		const type = mimetype.lookup(filePath) || 'audio/wav';
		return new Response(file, {
			headers: {
				'Content-Type': type,
			},
		});
	} catch (error) {
		console.error('Error:', error);
		return new Response('TTS Playback failed.', { status: 500 });
	}
}
