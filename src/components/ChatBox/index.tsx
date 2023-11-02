import { Message } from '@/app/types';
import { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';
import InputBox from './InputBox';

export const ChatBox = ({
	roles = ['USER', 'ASSISTANT'],
	messages,
	setMessages,
	deleteMessage,
	regenerateMessage,
	readOnly = false,
	handleSend,
	multiline = false,
}: {
	roles?: string[];
	messages: Message[];
	setMessages: (value: any) => void;
	deleteMessage?: (id: string) => void;
	regenerateMessage?: (id: string) => void;
	readOnly?: boolean;
	handleSend?: (content: string) => void;
	multiline?: boolean;
}) => {
	const [tempMsgContent, setTempMsgContent] = useState('');
	const messagesEndRef = useRef<null | HTMLDivElement>(null);
	const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
		new Set()
	);
	const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
	const [collapsedThoughts, setCollapsedThoughts] = useState<Set<string>>(
		new Set()
	);

	const [roleClassMap, setRoleClassMap] = useState(
		{} as Record<string, string>
	);

	useEffect(() => {
		if (messagesEndRef.current) {
			const top = messagesEndRef.current.scrollHeight;
			messagesEndRef.current.scroll({ top, behavior: 'smooth' });
		}
	}, [messages]);

	const toggleRole = (messageId: string) => {
		setMessages((prevMessages: any) => {
			return prevMessages.map((msg: Message) => {
				if (msg.id === messageId) {
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
		msg: Message,
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
	const toggleCollapse = (messageId: string) => {
		setCollapsedThoughts((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(messageId)) {
				newSet.delete(messageId);
			} else {
				newSet.add(messageId);
			}
			return newSet;
		});
	};
	const handleEdit = (id: string, content: string) => {
		setMessages((prevMessages: any) => {
			return prevMessages.map((msg: Message) => {
				if (msg.id === id) {
					return { ...msg, content };
				}
				return msg;
			});
		});
	};
	return (
		<div className="chatBox" ref={messagesEndRef}>
			{messages.map((msg, idx) => (
				<MessageItem
					extraClass={getRoleClass(msg.role)}
					key={idx}
					message={msg}
					index={idx}
					isThoughtCollapsed={collapsedThoughts.has(msg.id)}
					isSelected={selectedMessages.has(msg.id)}
					onToggleRole={() => !readOnly && toggleRole(msg.id)}
					onDelete={() => deleteMessage && deleteMessage(msg.id)}
					onRegenerate={() => regenerateMessage && regenerateMessage(msg.id)}
					onEdit={(id, content) => handleEdit(id, content)}
					onToggleThoughtCollapse={() => toggleCollapse(msg.id)}
					onCopy={() => navigator.clipboard.writeText(msg.content)}
					onSelect={(e) => handleSelect(e, msg, idx)}
					readOnly={readOnly}
				/>
			))}
			{deleteMessage && selectedMessages.size > 0 && (
				<button
					className="bulk-delete"
					onClick={() => {
						selectedMessages.forEach((id) => deleteMessage(id));
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
