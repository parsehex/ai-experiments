import React, { useState } from 'react';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

function ChatboxDemo() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');

	const handleMessageSubmit = (content: string) => {
		const lastMessageRole = messages[messages.length - 1]?.role || 'ASSISTANT';
		const role = lastMessageRole === 'USER' ? 'ASSISTANT' : 'USER';
		if (content.trim() !== '') {
			console.log(content);
			const newMessage: Message = {
				id: uuidv4(),
				role,
				content,
			};
			setMessages([...messages, newMessage]);
		}
	};

	const handleMessageDelete = (id: string) => {
		const updatedMessages = messages.filter((msg) => msg.id !== id);
		setMessages(updatedMessages);
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">ChatBox Demo</h1>
			<ChatBox
				messages={messages}
				setMessages={setMessages}
				deleteMessage={handleMessageDelete}
				handleSend={handleMessageSubmit}
				multiline={true}
			/>
		</div>
	);
}

export default ChatboxDemo;
