import React, { useState } from 'react';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types/llm';
import { makeMsg } from '@/lib/utils/messages';

function ChatboxDemo() {
	const [messages, setMessages] = useState<Message[]>([]);

	const handleMessageSubmit = (content: string) => {
		const lastMsgRole = messages[messages.length - 1]?.role || 'ASSISTANT';
		const nextRole = lastMsgRole === 'USER' ? 'ASSISTANT' : 'USER';
		if (content.trim() !== '') {
			console.log(content);
			const newMsg = makeMsg('message', nextRole, content);
			setMessages([...messages, newMsg]);
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
