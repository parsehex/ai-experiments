import { v4 } from 'uuid';
import { Character } from './types';

export function makeCharacter(opt: Omit<Partial<Character>, 'id'> = {}) {
	const c: Character = {
		id: v4(),
		name: '',
		description: '',
		state: '',
		objectives: { shortTerm: '', longTerm: '' },
	};
	return Object.assign(c, opt);
}
