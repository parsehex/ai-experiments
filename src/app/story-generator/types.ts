export interface Character {
	id: string;
	name: string;
	description: string;
	state: string;
	objectives: {
		shortTerm: string;
		longTerm: string;
	};
}

export interface Plot {
	storyDescription: string;
	location: string;
	timePeriod: string;
	// Currently unused:
	storySummary: string;
	upcomingEvents: string[];
}

export interface Action {
	id: string;
	type: 'Narrative' | 'Dialogue';
	str: string;
	characterName?: string;
}
