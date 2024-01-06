'use client';
import React, { useEffect, useState } from 'react';
import { ChatBox } from '@/components/ChatBox';
import { PromptPart, Message } from '@/lib/types/llm';
import { complete } from '@/lib/llm';
import { addMsg, makeMsg } from '@/lib/utils/messages';
import AIModelStatus from '@/components/AIModelStatus';
import { Character } from './types';

// TODO allow "self" info (for the user)
const getResponse = async (
	input: string,
	messages: Message[],
	char: Character | null
) => {
	const charName = char ? char.name : '';
	const charDesc = char ? char.description : '';
	const system: PromptPart[] = [
		{
			use: !char,
			val: 'Continue the following conversation between a user and an assistant.',
		},
		{
			use: !!char,
			val: `Continue the following conversation between a user and an assistant, named ${charName}. This is a description of ${charName}:\n"${charDesc}"\nTake this into account when responding to the user.`,
		},
	];
	const user: PromptPart[] = [{ val: input }];
	const prior_msgs = messages.map((msg) => ({
		role: msg.role,
		content: msg.content,
	}));
	const response = await complete(
		{ user, system, prior_msgs },
		{ temp: 1, max: 1500, stop: ['RESPONSE:', 'User:'], seed: 42, min_p: 0.5 }
	);
	return response;
};

const saveCharactersToLocalStorage = (characters: Character[]) => {
	localStorage.setItem('characters', JSON.stringify(characters));
};
const loadCharactersFromLocalStorage = (): Character[] => {
	const storedChars = localStorage.getItem('characters');
	return storedChars ? JSON.parse(storedChars) : [];
};
const defaultMsg = makeMsg(
	'message',
	'assistant',
	'Hi! What do you want to talk about?'
);
function CharacterChat() {
	const [messages, setMessages] = useState<Message[]>([defaultMsg]);
	const [characters, setCharacters] = useState<Character[]>([]);
	const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
		null
	);
	const [newCharacterName, setNewCharacterName] = useState('');
	const [newCharacterDescription, setNewCharacterDescription] = useState('');

	useEffect(() => {
		const loadedCharacters = loadCharactersFromLocalStorage();
		setCharacters(loadedCharacters);
	}, []);

	const addCharacter = (character: Character) => {
		const updatedCharacters = [...characters, character];
		setCharacters(updatedCharacters);
		saveCharactersToLocalStorage(updatedCharacters);
	};

	const removeCharacter = (characterName: string) => {
		const updatedCharacters = characters.filter(
			(c) => c.name !== characterName
		);
		setCharacters(updatedCharacters);
		saveCharactersToLocalStorage(updatedCharacters);
	};

	const selectCharacter = (characterName: string) => {
		const character = characters.find((c) => c.name === characterName);
		if (!character) return;
		if (selectedCharacter?.name === characterName) {
			setSelectedCharacter(null);
			return;
		}
		setSelectedCharacter(character);
	};

	const handleAddCharacter = () => {
		addCharacter({
			name: newCharacterName,
			description: newCharacterDescription,
		});
		setNewCharacterName('');
		setNewCharacterDescription('');
	};

	const handleSend = async (input: string) => {
		if (!input.trim()) return;

		const userMsg = makeMsg('message', 'user', input);
		const newMsgs = addMsg(userMsg, messages, setMessages);

		const resMsg = makeMsg(
			'message',
			'assistant',
			await getResponse(input, newMsgs.slice(0, -1), selectedCharacter)
		);
		addMsg(resMsg, newMsgs, setMessages);
	};

	const handleDeleteMessage = (id: string) => {
		const newMessages = messages.filter((msg) => msg.id !== id);
		setMessages(newMessages);
	};

	return (
		<div className="chat-container">
			<AIModelStatus type="llm" />
			<div className="flex flex-row">
				<div className="character-selection flex flex-col">
					{characters.map((character) => (
						<button
							className={
								selectedCharacter?.name === character.name ? 'font-bold' : ''
							}
							key={character.name}
							title={character.description}
							onClick={() => selectCharacter(character.name)}
							onContextMenu={(e) => {
								e.preventDefault();
								removeCharacter(character.name);
							}}
						>
							{character.name}
						</button>
					))}
					<button
						className="delete"
						title="Clear Chat"
						onClick={() => {
							// clear all but first
							setMessages([messages[0]]);
						}}
					>
						Clear Chat
					</button>
				</div>
				<div className="character-creation flex flex-col ml-2">
					<input
						className="input grow"
						type="text"
						placeholder="Character Name"
						value={newCharacterName}
						onChange={(e) => setNewCharacterName(e.target.value)}
					/>
					<textarea
						className="input"
						placeholder="Character Description"
						value={newCharacterDescription}
						onChange={(e) => setNewCharacterDescription(e.target.value)}
					/>
					<button onClick={handleAddCharacter}>Add Character</button>
				</div>
			</div>

			<div className="container">
				<ChatBox
					messages={messages}
					setMessages={setMessages}
					deleteMessage={handleDeleteMessage}
					handleSend={handleSend}
				/>
			</div>
		</div>
	);
}

export default CharacterChat;
