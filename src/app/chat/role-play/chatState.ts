import { useState } from 'react';
import { Message } from '@/app/types';

export const useChatState = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [characters, setCharacters] = useState([] as string[]);
	const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
	const [description, setDescription] = useState('');
	const [editingChar, setEditingChar] = useState<string | null>(null);
	const [tempCharName, setTempCharName] = useState('');
	const [oneAtATime, setOneAtATime] = useState(true);
	const [mainButton, setMainButton] = useState<
		'Send' | 'Test' | 'Fill' | 'Add' | 'Continue'
	>('Send');
	const [showOtherButtons, setShowOtherButtons] = useState(false);
	const constructPrompt = (
		msgs = messages,
		customDescription?: string,
		/** Prepend or append the custom description to the chat description, or only show the custom description */
		descOrder?: 'prepend' | 'append' | false
	) => {
		let prompt = '';
		if (customDescription) {
			if (descOrder === 'prepend') {
				prompt += customDescription + '\n' + description;
			}
			if (descOrder === 'append') {
				prompt += description + customDescription;
			}
		}
		if (!customDescription || descOrder === false) {
			prompt += customDescription;
		}
		if (prompt) {
			prompt += '\n\n';
		}
		msgs.forEach((msg) => {
			if (msg.role === 'ACTION' || !msg.role) {
				prompt += `${msg.content}\n`;
				return;
			}
			prompt += `${msg.role}: ${msg.content}\n`;
		});
		return prompt + '\n';
	};

	return {
		messages,
		setMessages,
		input,
		setInput,
		characters,
		setCharacters,
		selectedCharacter,
		setSelectedCharacter,
		description,
		setDescription,
		editingChar,
		setEditingChar,
		tempCharName,
		setTempCharName,
		oneAtATime,
		setOneAtATime,
		mainButton,
		setMainButton,
		showOtherButtons,
		setShowOtherButtons,
		constructPrompt,
	};
};
