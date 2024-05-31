import { GenerateTTSOptions } from '@/app/api/tts/generate/route';
import { Provider, Speaker } from '@/app/api/tts/types';
import axios from 'axios';
import { LoadModelResponse, UnloadModelResponse } from './types/new-api';

// TODO add /api/tts route that does most of this stuff
// this file will be a thin wrapper around that route
// route will have an option to save as file or return as blob
// this file will have a function that has the proper return types
// will also need speakers route

interface SpeakOptions {
	text: string;
	split_sentences?: boolean; // unused (true)
	language?: string; // (en)
	voice?: string; // (default)
}
interface SpeakResponse {
	/** Base64 WAV */
	audio: string;
	time: number;
}
interface SpeakToFileOptions extends SpeakOptions {
	file: string;
}
interface SpeakToFileResponse {
	file_name: string;
	time: number;
}

// new api:
// still figuring out switching models, can use different voices (and eventually add voices)
// GET /tts/v1/list-voices : { voices: string[] }
// POST /tts/v1/speak : SpeakOptions => SpeakResponse
// POST /tts/v1/speak-to-file : SpeakToFileOptions => SpeakToFileResponse

const BASE_URL = 'http://localhost:5000';

function base64ToBlob(base64: string): Blob {
	const byteString = atob(base64);
	const ab = new ArrayBuffer(byteString.length);
	const ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	return new Blob([ab], { type: 'audio/wav' });
}

// TODO is there a default voice?
export async function speak(text: string, voice: string): Promise<Blob> {
	const url = `${BASE_URL}/tts/v1/speak`;
	const body: SpeakOptions = {
		text,
		voice,
	};
	const res = await axios.post<SpeakResponse>(url, body);
	return base64ToBlob(res.data.audio);
}

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

export async function getVoices(): Promise<string[]> {
	const url = `${BASE_URL}/tts/v1/list-voices`;
	const res = await axios.get<{ voices: string[] }>(url);
	return res.data.voices;
}

export async function listModels(): Promise<string[]> {
	const res = await fetch(`${BASE_URL}/tts/v1/list-models`);
	const r = await res.json();
	return r.models;
}

export async function getModel(): Promise<string> {
	const res = await fetch(`${BASE_URL}/tts/v1/model`);
	const r = await res.json();
	return r.model;
}

export async function loadModel(model: string): Promise<LoadModelResponse> {
	const res = await fetch(`${BASE_URL}/tts/v1/model/load`, {
		method: 'POST',
		body: JSON.stringify({ model }),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	return await res.json();
}

export async function unloadModel(): Promise<UnloadModelResponse> {
	const res = await fetch(`${BASE_URL}/tts/v1/model/unload`, {
		method: 'POST',
		body: JSON.stringify({}),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	return await res.json();
}
