// copy this to ./starters.ts
import { makeCharacter } from './story';
import { Character, Plot, Setting } from './types';

interface Obj {
	defCharacters: Character[];
	defSetting: Setting;
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
	const location = '';
	const timePeriod = '';
	const storyDescription = '';
	return {
		defCharacters: [Char],
		defSetting: { location, timePeriod },
		defPlot: {
			storyDescription,
			// not used:
			storySummary: '',
			upcomingEvents: [],
		},
	};
};
