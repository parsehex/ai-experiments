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

export interface Setting {
	location: string;
	timePeriod: string;
}

export interface Plot {
	storyDescription: string;
	storySummary: string;
	upcomingEvents: string[];
}

export interface Action {
	id: string;
	type: 'Narrative' | 'Dialogue';
	str: string;
	characterName?: string;
}
