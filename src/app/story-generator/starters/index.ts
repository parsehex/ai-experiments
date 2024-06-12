import { StarterPreset } from '../types';
import buttandjohn from './buttandjohn';
import gwis from './gwis';

export const StarterPresets: StarterPreset[] = [
	{
		name: 'Blank',
		description: 'A blank slate',
		defaultCharacters: [],
		defaultPlot: {
			storyDescription: '',
			location: '',
			timePeriod: '',
			tone: '',
			storyIntro: '',
			storySummary: '',
			upcomingEvents: [],
		},
	},
	gwis(),
];

export default StarterPresets;
