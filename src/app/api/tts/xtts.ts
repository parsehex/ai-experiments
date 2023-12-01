// https://docs.sillytavern.app/extras/extensions/xtts/
// (also needed to `sudo apt-get install portaudio19-dev`)

import { addCorsIfNot } from '@/lib/utils';
import { Speaker } from './types';

const urlBase = 'http://localhost:8020/';
// http://localhost:8020/docs
// GET http://localhost:8020/speakers_list : string[]
// GET http://localhost:8020/speakers : Speaker[]
// GET http://localhost:8020/languages : { languages: Record<string, string> }
// GET http://localhost:8020/voices : { voices: Record<string, string> }
// GET http://localhost:8020/sample/{file_name}
// POST http://localhost:8020/tts_to_audio (TTARequestBody) : (returns audio directly)
// POST http://localhost:8020/tts_to_file (TTFRequestBody) : (i assume returns file path)

interface TTARequestBody {
	text: string;
	/** File extension not included */
	speaker_wav: string;
	/** E.g. `en` */
	language: string;
}
interface TTFRequestBody extends TTARequestBody {
	file_name_or_path: string;
}

export async function generateTTS(
	text: string,
	speaker_wav: string
): Promise<Blob> {
	const requestBody: TTARequestBody = {
		text,
		speaker_wav,
		language: 'en',
	};
	let url = addCorsIfNot(urlBase, 8020) + 'tts_to_audio/';
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestBody),
	});
	if (!response.ok) {
		throw new Error(`XTTS API responded with status: ${response.status}`);
	}
	const blob = await response.blob();
	return blob;
}

export async function generateTTSFile(
	text: string,
	speaker_wav: string,
	file: string
): Promise<Blob> {
	const requestBody: TTFRequestBody = {
		text,
		speaker_wav,
		language: 'en',
		file_name_or_path: '',
	};
	const url = addCorsIfNot(urlBase, 8020) + 'tts_to_file/';
	if (!file.endsWith('.wav')) file += '.wav';
	requestBody.file_name_or_path = file;

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestBody),
	});
	if (!response.ok) {
		throw new Error(`XTTS API responded with status: ${response.status}`);
	}
	return await response.json();
}

export async function getSpeakers(): Promise<Speaker[]> {
	const url = addCorsIfNot(urlBase, 8020) + 'speakers';
	const res = await fetch(url);
	return await res.json();
}
