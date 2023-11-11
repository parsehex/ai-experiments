import { StarterPreset } from '../types';
import buttandjohn from './buttandjohn';

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
	buttandjohn(),
];

export default StarterPresets;
