import { PromptPart } from '@/lib/llm/types';
import { PromptPartResponse } from '../..';

const LoraDescriptions: Record<string, string> = {
	add_detail: 'Add detail to an image',
	'aoc-1.1': 'Alexandria Ocasio-Cortez',
	aubrey_plaza: 'Aubrey Plaza',
	badhands: 'Try to fix badly-generated hands',
	breastinclassBetter: 'Enhances body anatomy',
	elastigirl_V3: 'Helen Parr',
	elizabeth_olsen_v3: 'Elizabeth Olsen',
	EmmaStone: 'Emma Stone',
	EmWat69: 'Emma Watson',
	'Frankie-20': 'Frankie Foster',
	'he-man': 'He-Man Style',
	HelenV2: 'Helen Parr',
	'Joe Biden': 'Joe Biden',
	leela: 'Turanga Leela',
	LowRA: 'Enhances image quality',
	mpeach: 'Peach, Mario Movie style',
	onOff_v326: 'Make clothes On/Off style',
	ppeach: 'More general Peach style',
	Scarlett4: 'Scarlett Johanson',
	Selena_3: 'Selena Gomez',
	TheRockV3: 'Dwayne Johnson',
	violet_V3: 'Violet Parr',
};

export function pickLoras({
	prompt,
	loras = LoraDescriptions,
}: {
	prompt: string;
	loras?: Record<string, string>;
}): PromptPartResponse {
	const system: PromptPart[] = [
		{
			str: 'The following is a description of an image.\n',
		},
		{
			str: 'Your task is to pick enhancements that would be relevant to the INPUT.\n',
		},
		{
			str: 'Describe the image that you want to create based on the input and chat summary.\n',
		},
		{
			str:
				'The following is an object describing the enhancements you may choose:' +
				JSON.stringify(loras, null, 2) +
				'\n',
		},
		{
			str: 'Respond with a JSON array of strings with up to 5 of the above keys.\n',
		},
	];
	const user: PromptPart[] = [{ str: `INPUT: ${prompt}\n` }];
	let prefixResponse = 'RESPONSE:';
	return { prefixResponse, system, user };
}
