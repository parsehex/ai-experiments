import { v4 } from 'uuid';
import { Character } from './types';

export function makeCharacter(
	opt: Omit<Partial<Character>, 'id'> = {},
	existingCharacter?: Character
) {
	const defaultCharacter: Character = {
		id: v4(),
		name: '',
		description: '',
		state: '',
		objectives: { shortTerm: '', longTerm: '' },
		isComplete: function () {
			return !!(
				this.name &&
				this.description &&
				this.state &&
				this.objectives.shortTerm &&
				this.objectives.longTerm
			);
		},
	};

	if (existingCharacter) {
		return Object.assign(existingCharacter, opt, {
			isComplete: defaultCharacter.isComplete,
		});
	}

	return Object.assign(defaultCharacter, opt);
}
