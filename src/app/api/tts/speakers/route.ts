import { NextRequest } from 'next/server';
import { Provider, Speaker } from '../types';
import * as openai from '../openai';
import * as xtts from '../xtts';
import { getParams } from '@/lib/utils';

export interface SpeakerTTSOptions {
	provider: Provider;
}

export async function GET(req: NextRequest) {
	try {
		const { provider } = getParams(req.url);
		let res: Speaker[];
		switch (provider as Provider) {
			case 'XTTS': {
				res = await xtts.getSpeakers();
				break;
			}
			case 'OpenAI': {
				res = await openai.getSpeakers();
				break;
			}
		}
		return new Response(JSON.stringify(res), {
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		console.error('Error:', error);
		return new Response('SpeakersList failed.', { status: 500 });
	}
}
