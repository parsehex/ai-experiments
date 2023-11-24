import React, { KeyboardEvent } from 'react';

interface InputBoxProps {
	onMessageSubmit: (content: string) => void;
	input: string;
	setInput: (value: string) => void;
	multiline?: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({
	onMessageSubmit,
	input,
	setInput,
	multiline = false,
}) => {
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
