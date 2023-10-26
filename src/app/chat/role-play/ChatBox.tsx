import { Message } from '@/app/types';
import { useEffect, useRef, useState } from 'react';

export const ChatBox = ({
	messages,
	deleteMessage,
	editingMsg,
	setEditingMsg,
	tempMsgContent,
	setTempMsgContent,
	handleMessageEdit,
	toggleRole,
	regenerateMessage,
}: {
	messages: Message[];
	deleteMessage: (id: string) => void;
	editingMsg: string | null;
	setEditingMsg: (editingMsg: string | null) => void;
	tempMsgContent: string;
	setTempMsgContent: (tempMsgContent: string) => void;
	handleMessageEdit: (id: string, newContent: string) => void;
	toggleRole: (role: string) => void;
	regenerateMessage: (id: string) => void;
}) => {
	const messagesEndRef = useRef<null | HTMLDivElement>(null);
	const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
		new Set()
	);
	const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

	const [roleClassMap, setRoleClassMap] = useState(
		{} as Record<string, string>
	);

	useEffect(() => {
		if (messagesEndRef.current) {
			const top = messagesEndRef.current.scrollHeight;
			messagesEndRef.current.scroll({ top, behavior: 'smooth' });
		}
	}, [messages]);

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
	return (
		<div className="chatBox" ref={messagesEndRef}>
			{messages.map((msg, idx) => {
				if (!msg) {
					console.error(`Message at index ${idx} is undefined!`, messages);
					const newMessages = [...messages];
					newMessages.splice(idx, 1);
					return null; // return null to avoid rendering this item
				}
				return (
					<div
						key={idx}
						className={`message ${getRoleClass(
							msg.role
						)} relative flex items-center`}
					>
						<input
							type="checkbox"
							className="absolute top-2 left-2"
							checked={selectedMessages.has(msg.id) ? true : false}
							onChange={(e) => {
								const updatedSelection = new Set(selectedMessages);

								// @ts-ignore
								if (e.nativeEvent.shiftKey && lastClickedIndex !== null) {
									// Get the start and end of the selection range
									const start = Math.min(lastClickedIndex, idx);
									const end = Math.max(lastClickedIndex, idx);

									// Determine the desired check state based on the end message
									const endMessageCheckState = !selectedMessages.has(
										messages[end].id
									);

									// Apply the desired check state to all messages in the range
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
									// Set the last clicked index
									setLastClickedIndex(idx);
								}

								setSelectedMessages(updatedSelection);
							}}
						/>

						<div className="flex-1 flex flex-col">
							<div className="flex items-center">
								<span className="message-header  flex items-center">
									<button
										className="delete mr-2"
										onClick={() => deleteMessage(msg.id)}
									>
										Delete
									</button>
									<button
										className="copy mr-2"
										onClick={() => navigator.clipboard.writeText(msg.content)}
									>
										Copy
									</button>

									<button
										className="regenerate mr-2"
										onClick={() => regenerateMessage(msg.id)}
									>
										Regenerate
									</button>

									<span
										className={
											'role ' + msg.role.toLowerCase().replace(/ /g, '_')
										}
										onClick={() => toggleRole(msg.id)}
									>
										{msg.role}:
									</span>
								</span>
							</div>
							{editingMsg === msg.id ? (
								<textarea
									className="input w-96"
									value={tempMsgContent}
									onChange={(e) => setTempMsgContent(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && e.shiftKey) {
											handleMessageEdit(msg.id, tempMsgContent);
											setEditingMsg(null);
										}
									}}
								/>
							) : (
								<span
									onClick={() => {
										setEditingMsg(msg.id);
										setTempMsgContent(msg.content);
									}}
								>
									{msg.content}
								</span>
							)}
						</div>
					</div>
				);
			})}
			{selectedMessages.size > 0 && (
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
		</div>
	);
};
