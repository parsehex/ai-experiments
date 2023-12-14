import { makeCharacter } from '../story';
import { StarterPreset } from '../types';

export default function buttandjohn(): StarterPreset {
	const GW = makeCharacter({
		name: 'George Washington',
		description: '1st President of the United States',
		state: '',
		objectives: {
			shortTerm: '',
			longTerm: 'Wants to reform the US but with planets',
		},
	});
	const location = 'Space';
	const timePeriod = 'Future';
	const storyDescription = '';
	return {
		name: 'George Washington in Space',
		description: '',
		defaultCharacters: [GW],
		defaultPlot: {
			storyDescription,
			location,
			timePeriod,
			storyIntro: '',
			tone: '',
			storySummary: '',
			upcomingEvents: [],
		},
	};
}
