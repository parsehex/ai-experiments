import { GenerateTTSOptions } from '@/app/api/tts/generate/route';
import { Provider, Speaker } from '@/app/api/tts/types';
import axios from 'axios';

// TODO add /api/tts route that does most of this stuff
// this file will be a thin wrapper around that route
// route will have an option to save as file or return as blob
// this file will have a function that has the proper return types
// will also need speakers route

export async function generateTTS(
	text: string,
	provider: Provider,
	voice: string,
	file?: string
): Promise<Blob> {
	const url = `/api/tts/generate`;
	const body: GenerateTTSOptions = {
		text,
		provider,
		voice,
		saveAsFile: file,
	};
	// throw error if file is not .wav or .mp3
	if (file && !file.endsWith('.wav') && !file.endsWith('.mp3')) {
		throw new Error('File must be .wav or .mp3');
	}
	const response = await axios.post(url, body, {
		responseType: 'blob',
	});
	return response.data;
}

export async function getSpeakers(provider: Provider): Promise<Speaker[]> {
	const url = `/api/tts/speakers?provider=${provider}`;
	const response = await axios.get(url);
	return response.data;
}
