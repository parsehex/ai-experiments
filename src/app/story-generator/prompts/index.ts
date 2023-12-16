import { PromptPart, PromptPartResponse } from '@/lib/types/llm';
import { Character, Plot, Action } from '../types';
import {
	CharacterString,
	PlotString,
	ActionsString,
	SettingString,
	hasPlot,
} from './utils';
import { ActionObject, CharacterObject, Sentences } from '@/lib/llm/grammar';

export function genStoryDescription(
	chars: Character[],
	plot: Plot
): PromptPartResponse {
	// use whatever info we have to generate a story description
	const charStr = `CHARACTERS:\n${CharacterString(chars)}\n`;
	const toneStr = `TONE: ${plot.tone}\n`;
	const settingStr = `${SettingString(plot)}\n`;
	const system: PromptPart[] = [
		{
			val: 'Write a short story description based on the following info. The description should concisely explain what the story is mainly about. Make sure not to go into too much detail. It should be compelling and creative.',
		},
	];
	const user: PromptPart[] = [
		{ val: 'STORY INFO:' },
		{ use: !!plot.tone, val: toneStr },
		{
			use: !!(plot.location || plot.timePeriod),
			val: settingStr,
		},
		{ use: chars.length > 0, val: charStr },
	];
	const prefixResponse = 'DESCRIPTION:';
	return { user, system, prefixResponse };
}

const relevancePrompt: Record<string, string> = {
	off: '',
	low: 'The character should be somewhat relevant to the story.',
	medium:
		'The character should be relevant to the story, fitting mildly with existing elements.',
	high: 'The character should be highly relevant and integral to the story.',
};
export function genCharacters(
	chars: Character[],
	plot: Plot,
	relevance: string
): PromptPartResponse {
	// use whatever info we have to generate a story description
	const charStr = CharacterString(chars);
	let relevanceStr = '';
	if (relevance !== 'off' && chars.length > 0)
		relevanceStr = relevancePrompt[relevance];
	const system: PromptPart[] = [
		{
			val: `Write a character based on the following story info.${relevanceStr}
Return an array of objects, which should have the following keys:
	"name": Give the character a first name.
	"description": A short description of the character, describing who they are and what they're like.
	"state": The character's current state, which describes what they're doing at the moment.
	"shortTermObjective": The character's short-term objective, which is what they want to accomplish in the short term.
	"longTermObjective": The character's long-term objective, which is what they want to accomplish over time, in the long term.`,
		},
	];
	const user: PromptPart[] = [
		{
			pre: `STORY INFO:\n`,
			val: `${PlotString(plot)}\n`,
		},
		{ use: chars.length > 0, val: `EXISTING CHARACTERS:\n${charStr}\n` },
	];
	const prefixResponse = 'CHARACTER:';
	const grammar = CharacterObject();
	return { user, system, prefixResponse, grammar };
}

export function genFillCharacterDetails(
	character: Character,
	allCharacters: Character[],
	plot: Plot
): PromptPartResponse {
	// Filter out the current character from the list of all characters
	const otherCharacters = allCharacters.filter((c) => c.id !== character.id);
	const otherCharsStr = CharacterString(otherCharacters);

	const system: PromptPart[] = [
		{
			val: `Generate detailed information for the following character based on the provided plot and other characters. Provide missing information only. Return an object with the updated details.`,
		},
	];
	const user: PromptPart[] = [
		{ val: `${PlotString(plot)}\n`, use: hasPlot(plot) },
		{
			use: otherCharacters.length > 0,
			val: `OTHER CHARACTERS:\n${otherCharsStr}\n`,
		},
		{ val: `CHARACTER INFO:\n` },
		{ val: `Name: ${character.name}\n`, use: !!character.name },
		{ val: `DESCRIPTION: \n`, use: !!character.description },
		{ val: `STATE: \n`, use: !!character.state },
		{ val: `SHORT-TERM OBJECTIVE: \n`, use: !!character.objectives.shortTerm },
		{ val: `LONG-TERM OBJECTIVE: \n`, use: !!character.objectives.longTerm },
	];
	const prefixResponse = 'CHARACTER:';
	const grammar = CharacterObject();

	return { user, system, prefixResponse, grammar };
}

export function genSetting(chars: Character[], plot: Plot): PromptPartResponse {
	const system: PromptPart[] = [
		{
			val: `Write a brief setting based on the following story info.
Important: The setting should make sense with the following story info.
Return an object with the following keys:
"location": The location of the story.
"timePeriod": The time period of the story.\n\n`,
		},
	];
	const user: PromptPart[] = [
		{ val: `STORY INFO:\n` },
		{
			use: !!plot.storyDescription,
			val: `DESCRIPTION: ${plot.storyDescription}\n`,
		},
		{ use: chars.length > 0, val: `CHARACTERS:\n${CharacterString(chars)}\n` },
	];
	const prefixResponse = 'SETTING:';
	return { user, system, prefixResponse };
}
export function genTone(chars: Character[], plot: Plot): PromptPartResponse {
	const system: PromptPart[] = [
		{
			val: `Write a Tone to guide how the following story should be written.
The tone should be a brief sentence that provides guidance to write the story, but should not be specific to the story itself in any way. It should properly convey the tone in which the story will be written.
A simple example would be "Dark and gritty but realistic."\n\n`,
		},
	];
	const user: PromptPart[] = [
		{ val: `STORY INFO:\n` },
		{
			use: !!plot.storyDescription,
			val: `DESCRIPTION: ${plot.storyDescription}\n`,
		},
		{
			use: !!(plot.location || plot.timePeriod),
			val: `${SettingString(plot)}\n`,
		},
		{ use: chars.length > 0, val: `CHARACTERS:\n${CharacterString(chars)}\n` },
	];
	const prefixResponse = 'RESPONSE:\n';
	const grammar = Sentences(1);
	return { user, system, prefixResponse, grammar };
}

export function genStarter(chars: Character[], plot: Plot): PromptPartResponse {
	const system: PromptPart[] = [
		{
			val: `Write an introduction to the story based on the following story info. It should set the stage for the story, introducing key elements and providing a clear point for the story to continue from.\n\n`,
		},
	];
	const user: PromptPart[] = [
		{ pre: `STORY INFO:\n`, val: `${PlotString(plot)}\n` },
		{ use: chars.length > 0, val: `CHARACTERS:\n${CharacterString(chars)}\n` },
	];
	const prefixResponse = 'RESPONSE:\n';
	const grammar = Sentences(1, false, 1, 3);
	return { user, system, prefixResponse, grammar };
}

export function genPickAction(
	chars: Character[],
	plot: Plot,
	actions: Action[],
	userRequest: string | null
): PromptPartResponse {
	// TODO: may need to break this step up to improve quality of thoughts
	//   1) pick narrative or dialogue (and character if dialogue)
	//   2) write thoughts on step 1's choice
	const system: PromptPart[] = [
		{
			val: `Choose something to happen in order to influence the next few sentences of the following story. You can pick anything that makes sense with the story so far. It can be a narrative or dialogue. It should be relevant to the story and move the plot forward without going too far in one step. You should refer to characters by name.
Return an object with the following keys:
"type": Either "Narrative" or "Dialogue". Narrative is a description of things happening in the story and Dialogue is a character speaking. What should the next line of the story be?
"characterName"?: Name of the character that you choose to speak, if Dialogue.
"str": Instruction on how to write the next part of the story. This should be a short description of what should happen next, and should be written in the form of an inner-thought, like "Character should do this" or "This should happen", and should provide direction on how to write the next part of the story.\n\n`,
		},
	];
	const user: PromptPart[] = [
		{ pre: `STORY INFO:\n`, val: `${PlotString(plot)}\n` },
		{ use: chars.length > 0, val: `CHARACTERS:\n${CharacterString(chars)}\n` },
		{ use: actions.length > 0, val: `STORY:\n${ActionsString(actions)}\n` },
	];
	let prefixResponse = '';
	if (userRequest)
		prefixResponse += `USER INFLUENCE:\n(These are the user's thoughts on what should happen next in the story, you should not reference these in your answer.)\n${userRequest}\n`;
	prefixResponse += `RESPONSE:\n`;
	const grammar = ActionObject();
	return { user, system, prefixResponse, grammar };
}

// When actually writing the next line, include less info in the prompt
// it'll have its thoughts, which were made with the full story info
export function genNarrativeAction(
	chars: Character[],
	plot: Plot,
	actions: Action[],
	narrativeThought: string
): PromptPartResponse {
	const system: PromptPart[] = [
		{
			val: `Write a narrative continuation based on the story's progression. Use descriptive language to depict the scene, actions, and emotions, drawing upon the previous story elements and your prior thoughts.
Your thoughts aren't part of the story, only you can see them.\n\n`,
		},
	];
	const user: PromptPart[] = [
		{ val: `STORY INFO:\n${PlotString(plot, false)}\n` },
		{
			use: chars.length > 0,
			val: `CHARACTERS:\n${CharacterString(chars, false)}\n`,
		},
		{ use: actions.length > 0, val: `STORY:\n${ActionsString(actions)}\n` },
	];
	let prefixResponse = '';
	if (narrativeThought)
		prefixResponse += `YOUR THOUGHTS:\n${narrativeThought}\n`;
	prefixResponse += `RESPONSE:\n`;
	const grammar = Sentences(1, false, 1, 3);
	return { user, system, prefixResponse, grammar };
}

export function genDialogueAction(
	chars: Character[],
	plot: Plot,
	actions: Action[],
	dialogueThought: string,
	speakingCharacter: string
): PromptPartResponse {
	const system: PromptPart[] = [
		{
			val: `Write some dialogue that fits the following story's current context. Reflect the speaking character's personality, motivations, and the previous story elements. Use your thoughts to guide what the character says. Your thoughts aren't part of the story, only you can see them.
	Your response should be spoken dialogue only with no narrative directions, in no more than 5 sentences.\n\n`,
		},
	];
	const user: PromptPart[] = [
		{ val: `STORY INFO:\n${PlotString(plot, false)}\n` },
		{
			use: chars.length > 0,
			val: `CHARACTERS:\n${CharacterString(chars, false)}\n`,
		},
		{ use: actions.length > 0, val: `STORY:\n${ActionsString(actions)}\n` },
	];
	let prefixResponse = '';
	if (dialogueThought) prefixResponse += `YOUR THOUGHTS:\n${dialogueThought}\n`;
	if (speakingCharacter) prefixResponse += `CHARACTER: ${speakingCharacter}\n`;
	prefixResponse += `RESPONSE:\n`;
	return { user, system, prefixResponse };
}
