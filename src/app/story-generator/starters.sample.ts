// copy this to ./starters.ts
import { makeCharacter } from './story';
import { Character, Plot } from './types';

interface Obj {
	defCharacters: Character[];
	defPlot: Plot;
}

export const MainStarter = (): Obj => {
	const Char = makeCharacter({
		name: '',
		description: '',
		state: '',
		objectives: {
			shortTerm: '',
			longTerm: '',
		},
	});
	const storyDescription = '';
	const location = '';
	const timePeriod = '';
	const tone = '';
	return {
		defCharacters: [Char],
		defPlot: {
			storyDescription,
			location,
			timePeriod,
			tone,
			// not used yet:
			storySummary: '',
			upcomingEvents: [],
		},
	};
};
