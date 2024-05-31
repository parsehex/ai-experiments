import React, { KeyboardEvent } from 'react';
import RecordButton from '../RecordButton';
import { WhisperResultChunk } from '@/lib/types';

interface InputBoxProps {
	onMessageSubmit: (content: string) => void;
	input: string;
	setInput: (value: string) => void;
	multiline?: boolean;
}
const combineWhisperParts = (parts: WhisperResultChunk[]) => {
	let text = '';
	// chunks are separated by a space
	// if the next chunk starts with an apostrophe or comma, don't add a space
	for (let i = 0; i < parts.length; i++) {
		const chunk = parts[i];
		text += chunk.speech;
		if (i < parts.length - 1) {
			const nextChunk = parts[i + 1];
			if (nextChunk.speech[0] === "'" || nextChunk.speech[0] === ',') continue;
			text += ' ';
		}
	}
	return text;
};

const InputBox: React.FC<InputBoxProps> = ({
	onMessageSubmit,
	input,
	setInput,
	multiline = false,
}) => {
	const [autoSend, setAutoSend] = React.useState(true);

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return;
		if (multiline && !e.shiftKey) return;
		e.preventDefault();
		onMessageSubmit(input);
		setInput('');
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setInput(e.target.value);
	};

	return (
		<div className="input-container mt-3 gap-2">
			<RecordButton
				onResult={(r) => {
					const text = combineWhisperParts(r);
					if (autoSend) {
						onMessageSubmit(text);
					} else {
						setInput(text);
					}
				}}
			/>
			<label className="flex flex-col items-center text-xs">
				Auto Send
				<input
					type="checkbox"
					checked={autoSend}
					onChange={(e) => setAutoSend(e.target.checked)}
				/>
			</label>
			{multiline ? (
				<textarea
					className="input mr-2 grow"
					value={input}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					placeholder="Type your message..."
					autoFocus
				/>
			) : (
				<input
					type="text"
					className="input grow"
					value={input}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					placeholder="Type your message..."
					autoFocus
				/>
			)}
			<button
				className="basic py-2 rounded-full"
				onClick={() => {
					onMessageSubmit(input);
					setInput('');
				}}
			>
				Send
			</button>
		</div>
	);
};

export default InputBox;
