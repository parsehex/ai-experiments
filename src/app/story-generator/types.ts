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
	characterName?: string;
	str: string;
	aiThoughts?: string;
}

// The interface that can be used to generate the grammar that the LLM's
//   response will be constrained to. Generate the grammar at
//   https://grammar.intrinsiclabs.ai/
// interface Action {
// 	type: 'Narrative' | 'Dialogue';
// 	characterName?: string;
// 	str: string;
// }

export interface StarterPreset {
	name: string;
	description: string;
	defaultCharacters: Character[];
	defaultPlot: Plot;
}
