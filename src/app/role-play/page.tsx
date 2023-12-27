'use client';
import React, { useState, useEffect } from 'react';
import { ChatBox } from '@/components/ChatBox';
import { CharacterManager } from './CharacterManager';
import { ChatOptions } from './ChatOptions';
import { useChatState } from './chatState';
import { useMessageHandler } from './chat-actions';
import { DescriptionTextArea } from './DescriptionTextArea';

function RolePlay() {
	useEffect(() => {
		if (typeof window !== 'undefined') {
			if (localStorage.getItem('chat-description'))
				setDescription(localStorage.getItem('chat-description') || '');
			if (localStorage.getItem('chat-characters'))
				setCharacters(
					JSON.parse(
						localStorage.getItem('chat-characters') || '["user", "assistant"]'
					)
				);
		}
		loadMessages();
	}, []);

	const addCharacter = (newCharacter: string) => {
		if (!characters.includes(newCharacter)) {
			setCharacters([...characters, newCharacter]);
		}
	};
	const removeCharacter = (character: string) => {
		if (characters.length > 2) {
			const updatedCharacters = characters.filter((char) => char !== character);
			setCharacters(updatedCharacters);
		}
	};
	const editCharacter = (oldCharacter: string, newCharacter: string) => {
		const updatedCharacters = characters.map((char) =>
			char === oldCharacter ? newCharacter : char
		);
		setCharacters(updatedCharacters);
		setMessages((prevMessages) =>
			prevMessages.map((msg) =>
				msg.role === oldCharacter ? { ...msg, role: newCharacter } : msg
			)
		);
	};

	const saveMessages = () => {
		localStorage.setItem('chat-messages', JSON.stringify(messages));
	};
	const loadMessages = () => {
		const savedMessages = localStorage.getItem('chat-messages');
		if (savedMessages) {
			setMessages(JSON.parse(savedMessages));
		}
	};
	const {
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
	} = useChatState();
	const {
		handleMainAction,
		handleSelectAction,
		handleSend,
		regenerateMessage,
	} = useMessageHandler({
		messages,
		setMessages,
		input,
		setInput,
		selectedCharacter,
		mainButton,
		oneAtATime,
		setShowOtherButtons,
		constructPrompt,
	});

	useEffect(() => {
		description && localStorage.setItem('chat-description', description);
		characters.length &&
			localStorage.setItem('chat-characters', JSON.stringify(characters));
	}, [description, characters]);

	// const preferredModels = ['Luna-AI-Llama2-Uncensored'];

	// useEffect(() => {
	// 	initializeModel(preferredModels);
	// }, []);

	const deleteMessage = (id: string) => {
		setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== id));
	};
	const [continueCount, setContinueCount] = useState(0);

	const Controls = (
		<div className="flex">
			<DescriptionTextArea
				description={description}
				setDescription={setDescription}
			/>
			<CharacterManager
				characters={characters}
				addCharacter={addCharacter}
				removeCharacter={removeCharacter}
				editCharacter={editCharacter}
				editingChar={editingChar}
				setEditingChar={setEditingChar}
				tempCharName={tempCharName}
				setTempCharName={setTempCharName}
			/>
			<ChatOptions oneAtATime={oneAtATime} setOneAtATime={setOneAtATime} />
			<div>
				<button onClick={() => saveMessages()}>Save</button>
				<button onClick={() => loadMessages()}>Load</button>
			</div>
		</div>
	);
	const ChatArea = (
		<div className="container">
			<ChatBox
				messages={messages}
				setMessages={setMessages}
				deleteMessage={deleteMessage}
				regenerateMessage={regenerateMessage}
				roles={characters.filter((char) => char !== 'ACTION')}
			/>
			<div className="input-container mt-2">
				<select
					className="input mr-2"
					value={selectedCharacter}
					onChange={(e) => setSelectedCharacter(e.target.value)}
				>
					{characters.map((char) => (
						<option key={char} value={char}>
							{char}
						</option>
					))}
					<option value="ACTION">ACTION</option>
				</select>
				<textarea
					className="input mr-2"
					onKeyDown={(e) => {
						if (e.key === 'Enter' && e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your message..."
				/>
				<div className="relative">
					<button
						onClick={() => setMessages([])}
						className="mr-2"
						title="Clear chat"
					>
						Clear
					</button>
					<button onClick={() => handleMainAction(mainButton)} className="mr-2">
						{mainButton}
					</button>
					<button onClick={() => setShowOtherButtons(!showOtherButtons)}>
						{showOtherButtons ? '\u25BC' : '\u25B2'}
					</button>
					{showOtherButtons && (
						<div className="absolute bottom-full right-0 z-10 bg-white dark:bg-gray-800 shadow-md rounded-md p-2">
							{['Test', 'Send', 'Fill', 'Add', 'Continue'].map((action) => (
								<span key={action} className="flex">
									<button
										className="text-sm"
										onClick={() => setMainButton(action as any)}
									>
										&#x25BC;
									</button>
									<button
										className="text-sm"
										onClick={() =>
											handleSelectAction(
												action,
												action === 'Continue' ? continueCount : undefined
											)
										}
									>
										{action}
									</button>
									{action === 'Continue' && (
										<input
											type="number"
											value={continueCount}
											onChange={(e) => setContinueCount(Number(e.target.value))}
											min="0"
											step="1"
											className="input w-12 mx-2 text-center"
										/>
									)}
								</span>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);

	return (
		<>
			{Controls}
			{ChatArea}
		</>
	);
}

export default RolePlay;
