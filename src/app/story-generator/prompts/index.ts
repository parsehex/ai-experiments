import { PromptPart } from '@/lib/types/llm';
import { Character, Plot, Action } from '../types';

function CharacterString(chars: Character[], isThought = true) {
	const mapFunc = (c: Character) => {
		let str = `- ${c.name}`;
		if (
			c.description ||
			c.state ||
			c.objectives.longTerm ||
			c.objectives.shortTerm
		) {
			str += ' ';
		}
		if (c.description) str += `- DESCRIPTION: ${c.description} `;
		if (c.state) str += `- STATE: ${c.state} `;
		if (isThought && c.objectives.longTerm)
			str += `- LONG-TERM OBJECTIVE: ${c.objectives.longTerm} `;
		if (isThought && c.objectives.shortTerm)
			str += `- SHORT-TERM OBJECTIVE: ${c.objectives.shortTerm} `;
		return str.trim();
	};
	return chars.map(mapFunc).join('\n');
}
function SettingString(plot: Plot) {
	let settingStr = `SETTING: `;
	if (plot.location) settingStr += `${plot.location}`;
	if (plot.timePeriod) {
		settingStr += plot.location ? ` in ` : 'Time Period - ';
		settingStr += plot.timePeriod;
	}
	return settingStr.trim();
}
function PlotString(plot: Plot, isThought = true) {
	let str = '';
	if (isThought && plot.storyDescription)
		str += `DESCRIPTION: ${plot.storyDescription}\n`;
	if (plot.tone) str += `TONE: ${plot.tone}\n`;
	if (plot.location || plot.timePeriod) str += `${SettingString(plot)}`;
	return str;
}
function ActionsString(actions: Action[]) {
	return actions
		.map((a) => {
			let str = '';
			if (a.type === 'Narrative') str = a.str;
			else if (a.type === 'Dialogue') str = `${a.characterName}: ${a.str}`;
			return str;
		})
		.join('\n');
}
function hasPlot(plot: Plot) {
	return (
		!!plot.storyDescription ||
		!!plot.tone ||
		!!plot.location ||
		!!plot.timePeriod
	);
}

export function genStoryDescription(
	chars: Character[],
	plot: Plot
): PromptPart[] {
	// use whatever info we have to generate a story description
	const charStr = CharacterString(chars);
	return [
		{
			str: 'Write a short story description based on the following info. The description should concisely explain what the story is mainly about. Make sure not to go into too much detail. It should be compelling and creative.\n\n',
			suf: `STORY INFO:\n`,
		},
		{
			if: !!plot.tone,
			str: `TONE: ${plot.tone}\n`,
		},
		{
			if: !!(plot.location || plot.timePeriod),
			str: `${SettingString(plot)}\n`,
		},
		{ if: chars.length > 0, str: `CHARACTERS:\n${charStr}\n` },
		{ str: 'RESPONSE:\n' },
	];
}

export function genCharacters(
	chars: Character[],
	plot: Plot,
	relevance: string
): PromptPart[] {
	// use whatever info we have to generate a story description
	const charStr = CharacterString(chars);
	const relevancePrompt = {
		off: '',
		low: 'The character should be somewhat relevant to the story.',
		medium:
			'The character should be relevant to the story, fitting mildly with existing elements.',
		high: 'The character should be highly relevant and integral to the story.',
	};
	let relevanceStr = '';
	if (relevance !== 'off' && chars.length > 0)
		// @ts-ignore
		relevanceStr = relevancePrompt[relevance];
	return [
		{
			str: `Write a character based on the following story info.${relevanceStr} Return an array of objects, which should have the following keys:
"name": Give the character a first name.
"description": A short description of the character, describing who they are and what they're like.
"state": The character's current state, which describes what they're doing at the moment.
"shortTermObjective": The character's short-term objective, which is what they want to accomplish in the short term.
"longTermObjective": The character's long-term objective, which is what they want to accomplish over time, in the long term.\n\n`,
			// "description": A short description of the character, describing their appearance, personality, and/or background.
			suf: `STORY INFO:\n`,
		},
		{
			str: `${PlotString(plot)}\n`,
		},
		{ if: chars.length > 0, str: `EXISTING CHARACTERS:\n${charStr}\n` },
		{ str: `RESPONSE:\n` },
	];
}

export function genFillCharacterDetails(
	character: Character,
	allCharacters: Character[],
	plot: Plot
): PromptPart[] {
	// Filter out the current character from the list of all characters
	const otherCharacters = allCharacters.filter((c) => c.id !== character.id);
	const otherCharsStr = CharacterString(otherCharacters);

	const promptParts: PromptPart[] = [
		{
			str: `Generate detailed information for the following character based on the story's plot and other characters. Provide missing information only. Return an object with the updated details.\n\n`,
		},
		{ str: `${PlotString(plot)}\n`, if: hasPlot(plot) },
		// Include other existing characters in the prompt
		{
			str: `OTHER CHARACTERS:\n${otherCharsStr}\n`,
			if: otherCharacters.length > 0,
		},
		{ str: `CHARACTER INFO:\n` },
		{ str: `Name: ${character.name}\n`, if: !!character.name },
		{ str: `DESCRIPTION: \n`, if: !!character.description },
		{ str: `STATE: \n`, if: !!character.state },
		{ str: `SHORT-TERM OBJECTIVE: \n`, if: !!character.objectives.shortTerm },
		{ str: `LONG-TERM OBJECTIVE: \n`, if: !!character.objectives.longTerm },
		{ str: `RESPONSE:\n` },
	];

	return promptParts;
}

export function genSetting(chars: Character[], plot: Plot): PromptPart[] {
	return [
		{
			str: `Write a brief setting based on the following story info.
Important: The setting should make sense with the following story info.
Return an object with the following keys:
"location": The location of the story.
"timePeriod": The time period of the story.\n\n`,
			suf: `STORY INFO:\n`,
		},
		{
			if: !!plot.storyDescription,
			str: `DESCRIPTION: ${plot.storyDescription}\n`,
		},
		{ if: chars.length > 0, str: `CHARACTERS:\n${CharacterString(chars)}\n` },
		{ str: `RESPONSE:\n` },
	];
}
export function genTone(chars: Character[], plot: Plot): PromptPart[] {
	return [
		{
			str: `Write a Tone to guide how the following story should be written.
The tone should be a brief sentence that provides guidance to write the story, but should not be specific to the story itself in any way. It should properly convey the tone in which the story will be written.
A simple example would be "Dark and gritty but realistic."\n\n`,
			// Important: The tone should make sense with the following story info.\n\n`,
			suf: `STORY INFO:\n`,
		},
		{
			if: !!plot.storyDescription,
			str: `DESCRIPTION: ${plot.storyDescription}\n`,
		},
		{
			if: !!(plot.location || plot.timePeriod),
			str: `${SettingString(plot)}\n`,
		},
		{ if: chars.length > 0, str: `CHARACTERS:\n${CharacterString(chars)}\n` },
		{ str: `RESPONSE:\n` },
	];
}

export function genStarter(chars: Character[], plot: Plot): PromptPart[] {
	return [
		{
			str: `Write an introduction to the story based on the following story info. It should set the stage for the story, introducing key elements and providing a clear point for the story to continue from.\n\n`,
			suf: `STORY INFO:\n`,
		},
		{ str: `${PlotString(plot)}\n` },
		{ if: chars.length > 0, str: `CHARACTERS:\n${CharacterString(chars)}\n` },
		{ str: `RESPONSE:\n` },
	];
}

export function genPickAction(
	chars: Character[],
	plot: Plot,
	actions: Action[],
	userRequest: string | null
): PromptPart[] {
	// TODO: may need to break this step up to improve quality of thoughts
	//   1) pick narrative or dialogue (and character if dialogue)
	//   2) write thoughts on step 1's choice
	return [
		{
			str: `Choose something to happen in order to influence the next few sentences of the following story. You can pick anything that makes sense with the story so far. It can be a narrative or dialogue. It should be relevant to the story and move the plot forward without going too far in one step. You should refer to characters by name.
Return an object with the following keys:
"type": Either "Narrative" or "Dialogue". Narrative is a description of things happening in the story and Dialogue is a character speaking. What should the next line of the story be?
"characterName"?: Name of the character that you choose to speak, if Dialogue.
"str": Instruction on how to write the next part of the story. This should be a short description of what should happen next, and should be written in the form of an inner-thought, like "Character should do this" or "This should happen", and should provide direction on how to write the next part of the story.\n\n`,
			suf: `STORY INFO:\n`,
		},
		{ str: `${PlotString(plot)}\n` },
		{ if: chars.length > 0, str: `CHARACTERS:\n${CharacterString(chars)}\n` },
		{ if: actions.length > 0, str: `STORY:\n${ActionsString(actions)}\n` },
		{
			if: !!userRequest,
			str: `USER INFLUENCE:\n(These are the user's thoughts on what should happen next in the story, you should not reference these in your answer.)\n${userRequest}\n`,
		},
		{ str: `RESPONSE:\n` },
	];
}

// When actually writing the next line, include less info in the prompt
// it'll have its thoughts, which were made with the full story info
export function genNarrativeAction(
	chars: Character[],
	plot: Plot,
	actions: Action[],
	narrativeThought: string
): PromptPart[] {
	return [
		{
			str: `Write a narrative continuation based on the story's progression. Use descriptive language to depict the scene, actions, and emotions, drawing upon the previous story elements and your prior thoughts.
Your thoughts aren't part of the story, only you can see them.\n\n`,
		},
		{ str: `STORY INFO:\n${PlotString(plot, false)}\n` },
		{
			if: chars.length > 0,
			str: `CHARACTERS:\n${CharacterString(chars, false)}\n`,
		},
		{ if: actions.length > 0, str: `STORY:\n${ActionsString(actions)}\n` },
		{
			if: !!narrativeThought,
			str: `YOUR THOUGHTS:\n${narrativeThought}\n`,
		},
		{ str: `RESPONSE:\n` },
	];
}

export function genDialogueAction(
	chars: Character[],
	plot: Plot,
	actions: Action[],
	dialogueThought: string,
	speakingCharacter: string
): PromptPart[] {
	return [
		{
			str: `Write some dialogue that fits the following story's current context. Reflect the speaking character's personality, motivations, and the previous story elements. Use your thoughts to guide what the character says. Your thoughts aren't part of the story, only you can see them.
Your response should be spoken dialogue only with no narrative directions, in no more than 5 sentences.\n\n`,
		},
		{ str: `STORY INFO:\n${PlotString(plot, false)}\n` },
		{
			if: chars.length > 0,
			str: `CHARACTERS:\n${CharacterString(chars, false)}\n`,
		},
		{ if: actions.length > 0, str: `STORY:\n${ActionsString(actions)}\n` },
		{
			if: !!dialogueThought,
			str: `YOUR THOUGHTS:\n${dialogueThought}\n`,
		},
		{
			if: !!speakingCharacter,
			str: `CHARACTER: ${speakingCharacter}\n`,
		},
		{ str: `RESPONSE:\n` },
	];
}
