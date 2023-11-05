import { PromptPart } from '@/lib/llm/types';
import { Character, Plot, Action } from './types';

const CharacterString = (chars: Character[]) => {
	return chars
		.map((c) => {
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
			if (c.objectives.longTerm)
				str += `- LONG-TERM OBJECTIVE: ${c.objectives.longTerm} `;
			if (c.objectives.shortTerm)
				str += `- SHORT-TERM OBJECTIVE: ${c.objectives.shortTerm} `;
			return str.trim();
		})
		.join('\n');
};
const SettingString = (plot: Plot) => {
	let settingStr = `SETTING: `;
	if (plot.location) settingStr += `${plot.location}`;
	if (plot.timePeriod) {
		settingStr += plot.location ? ` in ` : 'Time Period - ';
		settingStr += plot.timePeriod;
	}
	return settingStr;
};
const ActionString = (actions: Action[]) => {
	return actions
		.map((a) => {
			let str = '';
			if (a.type === 'Narrative') str = a.str;
			else if (a.type === 'Dialogue') str = `${a.characterName}: ${a.str}`;
			return str;
		})
		.join('\n');
};

export function genStoryDescription(
	chars: Character[],
	plot: Plot
): PromptPart[] {
	// use whatever info we have to generate a story description
	const settingStr = SettingString(plot);
	const charStr = CharacterString(chars);
	return [
		{
			str: 'Write a short story description based on the following info. The description should concisely explain what the story is mainly about, making sure not to go into too much detail. It should be compelling and creative.\n\n',
		},
		{
			if: !!(plot.location || plot.timePeriod),
			str: `${settingStr}\n\n`,
		},
		{ if: chars.length > 0, str: `CHARACTERS:\n${charStr}\n` },
		{ str: 'DESCRIPTION:\n' },
	];
}

export function genCharacters(chars: Character[], plot: Plot): PromptPart[] {
	// use whatever info we have to generate a story description
	const settingStr = SettingString(plot);
	const charStr = CharacterString(chars);
	return [
		{
			str: `Write characters based on the following story info.${
				chars.length > 0
					? 'Important: Characters should be different than existing ones, and make sense given the context.'
					: ''
			} Return an array of objects, which should have the following keys:
"name": Give the character a first name.
"description": A short description of the character, describing their appearance, personality, and/or background.
"state": The character's current state, such as their current location or emotional state.
"shortTermObjective": The character's short-term objective, which is what they want to accomplish in the short term.
"longTermObjective": The character's long-term objective, which is what they want to accomplish in the long term.\n\n`,
			suf: `STORY INFO:\n`,
		},
		{
			if: !!plot.storyDescription,
			str: `DESCRIPTION: ${plot.storyDescription}\n`,
		},
		{
			if: !!(plot.location || plot.timePeriod),
			str: `${settingStr}\n`,
		},
		{ if: chars.length > 0, str: `EXISTING CHARACTERS:\n${charStr}\n` },
		{ str: `CHARACTERS:\n` },
	];
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
		{ str: `SETTING:\n` },
	];
	// TODO try using grammar for filling in (if there's already a value)
	// (Make the model return whatever the value is, then generate more of it)
}

export function genStarter(chars: Character[], plot: Plot): PromptPart[] {
	return [
		{
			str: `Write a start to the story based on the following story info. It should be relevant to the story, and provide a distinct starting point for the story to unfold from.
Return a string that starts the story.\n\n`,
			suf: `STORY INFO:\n`,
		},
		{
			if: !!plot.storyDescription,
			str: `DESCRIPTION: ${plot.storyDescription}\n`,
		},
		{ if: chars.length > 0, str: `CHARACTERS:\n${CharacterString(chars)}\n` },
		{ str: `${SettingString(plot)}\n` },
		{ str: `STORY START:\n` },
	];
}

export function genPickAction(
	chars: Character[],
	plot: Plot,
	actions: Action[]
): PromptPart[] {
	return [
		{
			str: `Pick something to happen in order to continue the following story. You can pick anything that makes sense with the story so far. It can be an action or dialogue. It should be relevant to the story and move it forward.
Return an object with the following keys:
"type": Either "Narrative" or "Dialogue". Narrative is a description of things happening in the story. Dialogue is a character speaking. What should the next line of the story be?
"str": Advice on how to write the next part of the story. This should be a short description of what should happen next, and should be written in the form of an inner-thought, like "Character should do this" or "This should happen", and should provide direction on how to write the next part of the story.
"characterName": Name of the character who is speaking, if dialogue.\n\n`,
			suf: `STORY INFO:\n`,
		},
		{
			if: !!plot.storyDescription,
			str: `DESCRIPTION: ${plot.storyDescription}\n`,
		},
		{ if: chars.length > 0, str: `CHARACTERS:\n${CharacterString(chars)}\n` },
		{
			if: !!(plot.location || plot.timePeriod),
			str: `${SettingString(plot)}\n`,
		},
		{ if: actions.length > 0, str: `STORY:\n${ActionString(actions)}\n` },
		{ str: `THOUGHT:\n` },
	];
}

export function genWriteAction(
	chars: Character[],
	plot: Plot,
	actions: Action[],
	thisActionThoughts: string
): PromptPart[] {
	// TODO: the story's description shouldn't be treated as part of the story
	//   as in, if there's a piece of info in the description, it still needs to be
	//   included in the story with an ntroduction and such
	return [
		{
			str: `Write the next part of the following story. You should take your thoughts into account and expand on them when writing the part. It should be relevant to the given story info and should move the plot forward.
Return an object with the following keys:
"type": Either "Narrative" or "Dialogue".
"str": Written response, using the provided guidance.
"characterName": Name of the character who is speaking, if Dialogue.\n\n`,
			suf: `STORY INFO:\n`,
		},
		{
			if: !!plot.storyDescription,
			str: `DESCRIPTION: ${plot.storyDescription}\n`,
		},
		{ if: chars.length > 0, str: `CHARACTERS:\n${CharacterString(chars)}\n` },
		{
			if: !!(plot.location || plot.timePeriod),
			str: `${SettingString(plot)}\n`,
		},
		{ if: actions.length > 0, str: `STORY:\n${ActionString(actions)}\n` },
		{
			if: !!thisActionThoughts,
			str: `THOUGHTS:\n(These are your thoughts on how to write the next part of the story.)\n${thisActionThoughts}\n`,
		},
		{ str: `NEXT PART:\n` },
	];
}