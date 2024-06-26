import axios from 'axios';
import { Speaker } from './types';

export async function generateTTS(
	input: string,
	voice: string,
	apiKey: string
): Promise<Blob> {
	const url = `https://api.openai.com/v1/audio/speech`;
	const body = {
		model: 'tts-1',
		input,
		voice,
	};
	const response = await axios.post(url, body, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
		// responseType: 'blob',
	});
	// convert to from string to blob
	const blob = new Blob([response.data], { type: 'audio/mpeg' });
	return blob;
}
export async function getSpeakers(): Promise<Speaker[]> {
	const names = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
	const speakers = names.map((name) => ({
		name,
		voice_id: name,
		preview_url: ``,
	}));
	return speakers;
}
