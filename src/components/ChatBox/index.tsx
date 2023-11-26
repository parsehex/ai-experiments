import '@/styles/chatbox.scss';
import { CustomBtns, Message } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';
import InputBox from './InputBox';

// @ts-ignore
export interface AlternateMessage extends Message {
	content: string | Promise<string>;
}

export const ChatBox = ({
	roles = ['USER', 'ASSISTANT'],
	messages,
	setMessages,
	deleteMessage,
	deleteMessages,
	regenerateMessage,
	readOnly = false,
	handleSend,
	multiline = false,
	defExpandImages = false,
	defExpandThoughts = false,
	handleEdit,
	customBtns,
}: {
	roles?: string[];
	messages: AlternateMessage[];
	// messages: Message[];
	setMessages: (value: any) => void;
	deleteMessage?: (id: string) => void;
	deleteMessages?: (ids: string[]) => void;
	regenerateMessage?: (id: string) => void | Promise<void>;
	readOnly?: boolean;
	handleSend?: (content: string) => void;
	multiline?: boolean;
	defExpandImages?: boolean;
	defExpandThoughts?: boolean;
	handleEdit?: (id: string, content: string) => void;
	customBtns?: CustomBtns;
}) => {
	const [tempMsgContent, setTempMsgContent] = useState('');
	const messagesEndRef = useRef<null | HTMLDivElement>(null);
	const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
		new Set()
	);
	const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

	const [roleClassMap, setRoleClassMap] = useState(
		{} as Record<string, string>
	);

	useEffect(() => {
		const lastMsgIsThought = messages[messages.length - 1]?.type === 'thought';
		if (messagesEndRef.current && !lastMsgIsThought) {
			const top = messagesEndRef.current.scrollHeight;
			messagesEndRef.current.scroll({ top, behavior: 'smooth' });
		}
	}, [messages]);

	const toggleRole = (messageId: string) => {
		setMessages((prevMessages: any) => {
			return prevMessages.map((msg: Message) => {
				if (msg.id === messageId) {
					// console.log(msg);
					const currentIndex = roles.indexOf(msg.role);
					const nextRole = roles[(currentIndex + 1) % roles.length];
					return { ...msg, role: nextRole };
				}
				return msg;
			});
		});
	};

	const getRoleClass = (role: string) => {
		if (role === 'ACTION') return 'action';

		if (!roleClassMap[role]) {
			const currentRoles = Object.keys(roleClassMap);
			const nextClass = `roleColor${currentRoles.length + 1}`;
			setRoleClassMap({ ...roleClassMap, [role]: nextClass });
			return nextClass;
		}
		return roleClassMap[role];
	};

	const handleSelect = (
		e: React.ChangeEvent<HTMLInputElement>,
		msg: AlternateMessage,
		idx: number
	) => {
		const updatedSelection = new Set(selectedMessages);

		// @ts-ignore
		if (e.nativeEvent.shiftKey && lastClickedIndex !== null) {
			// Get the start and end of the selection range
			const start = Math.min(lastClickedIndex, idx);
			const end = Math.max(lastClickedIndex, idx);

			// Determine the desired check state based on the last message
			const endMessageCheckState = !selectedMessages.has(messages[end].id);

			for (let i = start; i <= end; i++) {
				const messageId = messages[i].id;
				if (endMessageCheckState) {
					updatedSelection.add(messageId);
				} else {
					updatedSelection.delete(messageId);
				}
			}
		} else {
			if (updatedSelection.has(msg.id)) {
				updatedSelection.delete(msg.id);
			} else {
				updatedSelection.add(msg.id);
			}
			setLastClickedIndex(idx);
		}

		setSelectedMessages(updatedSelection);
	};
	return (
		<div className="chatBox" ref={messagesEndRef}>
			{messages.map((msg, idx) => (
				<MessageItem
					extraClass={getRoleClass(msg.role)}
					key={idx}
					message={msg}
					index={idx}
					isSelected={selectedMessages.has(msg.id)}
					onToggleRole={() => !readOnly && toggleRole(msg.id)}
					onDelete={deleteMessage}
					onRegenerate={regenerateMessage}
					onEdit={(id, content) => {
						handleEdit && handleEdit(id, content);
					}}
					onCopy={async () => navigator.clipboard.writeText(await msg.content)}
					hasSelect={deleteMessages !== undefined}
					onSelect={(e) => handleSelect(e, msg, idx)}
					readOnly={readOnly}
					defExpandImages={defExpandImages}
					defExpandThoughts={defExpandThoughts}
					customBtns={customBtns}
				/>
			))}
			{deleteMessages && selectedMessages.size > 0 && (
				<button
					className="bulk-delete"
					onClick={() => {
						deleteMessages(Array.from(selectedMessages));
						setSelectedMessages(new Set());
					}}
				>
					Delete Selected
				</button>
			)}
			{handleSend && (
				<InputBox
					onMessageSubmit={handleSend}
					input={tempMsgContent}
					setInput={setTempMsgContent}
					multiline={multiline}
				/>
			)}
		</div>
	);
};
