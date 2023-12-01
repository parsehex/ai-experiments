import * as xtts from './xtts';

export type Provider = 'XTTS';
export interface Speaker {
	name: string;
	voice_id: string;
	preview_url: string;
}

export function generateTTS(
	text: string,
	provider: Provider,
	voice: string
): Promise<Blob> {
	switch (provider) {
		case 'XTTS':
			return xtts.generateTTS(text, voice);
	}
}

export function getSpeakers(provider: Provider): Promise<Speaker[]> {
	switch (provider) {
		case 'XTTS':
			return xtts.getSpeakers();
	}
}
