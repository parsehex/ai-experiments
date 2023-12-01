export type Provider = 'XTTS' | 'OpenAI';

export interface Speaker {
	name: string;
	voice_id: string;
	preview_url: string;
}
