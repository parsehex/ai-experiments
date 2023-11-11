/*
	Yeah this one's immature and all but I've been really amused by
		how the LLM runs with this one. It's a good example of how
		the LLM can take a silly premise and build on it to make
		something interesting.
	I started with the character name, description and state,
		and I've cherry-picked the rest from generated results over time.
*/

import { makeCharacter } from '../story';
import { StarterPreset } from '../types';

export default function buttandjohn(): StarterPreset {
	const Butt = makeCharacter({
		name: 'Butt',
		description: 'Has a big anus',
		state: 'Is pissed off',
		objectives: {
			shortTerm: 'Find a way to make his anus smaller',
			longTerm: 'Become an anus surgeon',
		},
	});
	const John = makeCharacter({
		name: 'John',
		description:
			'John is a middle-aged farmer who loves his land and animals but struggles to make ends meet.',
		state: 'John is repairing a broken fence in his farm',
		objectives: {
			shortTerm:
				'John wants to repair all the broken fences in his farm before the rainy season begins',
			longTerm:
				'John dreams of expanding his farm and becoming a successful farmer',
		},
	});
	const location = 'A small town in the countryside';
	const timePeriod = 'Present day';
	const storyDescription =
		"The story revolves around Butt, a man with an unusually large anus, and John, a struggling farmer. Butt, frustrated with his oversized anus, dreams of becoming an anus surgeon to solve his problem. Meanwhile, John toils away repairing broken fences on his farm, hoping to expand and achieve success. Their paths cross when Butt accidentally wanders into John's farm, leading to a series of comical and satirical encounters that ultimately help both characters realize their true potential and aspirations. As Butt seeks help to make his anus smaller, and John strives to repair all his broken fences before the rainy season, they form an unlikely friendship that brings laughter and wisdom to their small countryside town.";
	return {
		name: 'Butt and John',
		description: '',
		defaultCharacters: [Butt, John],
		defaultPlot: {
			storyDescription,
			location,
			timePeriod,
			storyIntro: '',
			tone: 'Jovial and light-hearted with a touch of satire.',
			storySummary: '',
			upcomingEvents: [],
		},
	};
}

/*
actions: [
  {
    "type": "Narrative",
    "str": "Butt read the instructions out loud to himself, trying to understand how to reduce the size of his anus. The book claimed that the secret to a smaller anus was to apply a special cream made from rare herbs, which needed to be applied daily for a month. Butt was skeptical but desperate, so he decided to give it a try.",
    "characterName": "Butt",
    "id": "9c6344ad-b6f0-4322-b5c2-74c19136b3f4"
  }
]
*/
