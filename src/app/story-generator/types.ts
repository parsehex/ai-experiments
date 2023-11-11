export interface Character {
	id: string;
	name: string;
	description: string;
	state: string;
	objectives: {
		shortTerm: string;
		longTerm: string;
	};
	isComplete(): boolean;
}

export interface Plot {
	storyDescription: string;
	location: string;
	timePeriod: string;
	tone: string;
	storyIntro: string;
	// Currently unused:
	storySummary: string;
	upcomingEvents: string[];
}

export interface Action {
	id: string;
	type: 'Narrative' | 'Dialogue';
	str: string;
	characterName?: string;
	aiThoughts?: string;
}

export interface StarterPreset {
	name: string;
	description: string;
	defaultCharacters: Character[];
	defaultPlot: Plot;
}
