import { HoverMenuFormField } from '@/components/HoverMenuButton';

export const addCharacterOptions: HoverMenuFormField[] = [
	{
		type: 'number',
		label: 'Num Chars',
		title: 'How many characters to add',
		name: 'numChars',
		placeholder: '1',
	},
	{
		type: 'select',
		label: 'Relevance',
		title: 'How relevant the characters should be to the story',
		name: 'relevance',
		options: [
			{ value: 'off', label: 'Off' },
			{ value: 'low', label: 'Low' },
			{ value: 'medium', label: 'Medium' },
			{ value: 'high', label: 'High' },
		],
		defaultValue: 'off',
	},
];
