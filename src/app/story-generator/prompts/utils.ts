import { Character, Plot, Action } from '../types';

export function CharacterString(chars: Character[], isThought = true) {
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
export function SettingString(plot: Plot) {
	let settingStr = `SETTING: `;
	if (plot.location) settingStr += `${plot.location}`;
	if (plot.timePeriod) {
		settingStr += plot.location ? ` in ` : 'Time Period - ';
		settingStr += plot.timePeriod;
	}
	return settingStr.trim();
}
export function PlotString(plot: Plot, isThought = true) {
	let str = '';
	if (isThought && plot.storyDescription)
		str += `DESCRIPTION: ${plot.storyDescription}\n`;
	if (plot.tone) str += `TONE: ${plot.tone}\n`;
	if (plot.location || plot.timePeriod) str += `${SettingString(plot)}`;
	return str;
}
export function ActionsString(actions: Action[]) {
	return actions
		.map((a) => {
			let str = '';
			if (a.type === 'Narrative') str = a.str;
			else if (a.type === 'Dialogue') str = `${a.characterName}: ${a.str}`;
			return str;
		})
		.join('\n');
}
export function hasPlot(plot: Plot) {
	return (
		!!plot.storyDescription ||
		!!plot.tone ||
		!!plot.location ||
		!!plot.timePeriod
	);
}
