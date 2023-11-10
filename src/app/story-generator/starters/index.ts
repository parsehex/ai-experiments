import { makeCharacter } from '../story';
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
			storySummary: '',
			upcomingEvents: [],
		},
	},
	buttandjohn(),
];

export default StarterPresets;
