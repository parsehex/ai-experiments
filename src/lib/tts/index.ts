import * as openai from './openai';
import * as xtts from './xtts';

const ApiKeys = {} as Record<string, string>;

export type Provider = 'XTTS' | 'OpenAI';
export interface Speaker {
	name: string;
	voice_id: string;
	preview_url: string;
}

async function getApiKey(provider: Provider): Promise<string> {
	if (ApiKeys[provider]) return ApiKeys[provider];
	const response = await fetch('/api/api-keys');
	const res = await response.json();
	const key = Object.entries(res).find(([key, value]) => {
		return key.toLowerCase().includes(provider.toLowerCase());
	})?.[0];
	if (!key) throw new Error(`No API key found for provider: ${provider}`);
	ApiKeys[provider] = res[key];
	return res[key];
}
export async function generateTTS(
	text: string,
	provider: Provider,
	voice: string
): Promise<Blob> {
	switch (provider) {
		case 'XTTS':
			return await xtts.generateTTS(text, voice);
		case 'OpenAI':
			return await openai.generateTTS(text, voice, await getApiKey(provider));
	}
}

export async function getSpeakers(provider: Provider): Promise<Speaker[]> {
	switch (provider) {
		case 'XTTS':
			return await xtts.getSpeakers();
		case 'OpenAI':
			return await openai.getSpeakers();
	}
}
