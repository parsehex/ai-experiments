import { Message } from '@/lib/types';
import React from 'react';
import ImgCarousel from '../ImgCarousel';

interface MessageItemProps {
	message: Message;
	index: number;
	isThoughtCollapsed: boolean;
	isSelected: boolean;
	onToggleRole: (id: string) => void;
	onDelete?: (id: string) => void;
	onRegenerate?: (id: string) => void;
	onEdit: (id: string, content: string) => void;
	onToggleThoughtCollapse: (id: string) => void;
	onCopy: (id: string) => void;
	onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
	readOnly: boolean;
	extraClass?: string;
	defExpandImages?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
	message,
	index,
	isThoughtCollapsed,
	isSelected,
	onToggleRole,
	onDelete,
	onRegenerate,
	onEdit,
	onToggleThoughtCollapse,
	onCopy,
	onSelect,
	readOnly,
	extraClass = '',
	defExpandImages,
}) => {
	const contentRef = React.useRef(null as HTMLSpanElement | null);
	const [contentHeight, setContentHeight] = React.useState(0);
	const [editingMsg, setEditingMsg] = React.useState<string | null>(null);
	const [tempMsgContent, setTempMsgContent] = React.useState<string>('');

	React.useEffect(() => {
		if (contentRef.current) {
			setContentHeight(contentRef.current.offsetHeight);
		}
	}, [message.content]);

	const handleMessageEdit = (id: string, content: string) => {
		onEdit(id, content);
		setEditingMsg(null);
	};

	const toggleRole = (id: string) => {
		onToggleRole(id);
	};

	const toggleCollapse = (id: string) => {
		onToggleThoughtCollapse(id);
	};

	return (
		<div
			className={`message relative mb-1 flex items-center ${extraClass}`}
			key={index}
		>
			<input
				type="checkbox"
				className="absolute top-2 left-2"
				checked={isSelected}
				onChange={(e) => onSelect(e)}
			/>

			<div
				className={`flex-1 flex flex-col ${
					isThoughtCollapsed ? 'collapsed' : ''
				}`}
			>
				<span
					className="message-header"
					style={{ display: message.type === 'thought' ? 'none' : 'flex' }}
				>
					<span
						className={`role ${message.role.toLowerCase().replace(/ /g, '_')}`}
						onClick={() => !readOnly && toggleRole(message.id)}
					>
						{message.role}
					</span>
					{!readOnly && onDelete && (
						<button
							className="delete mr-2"
							onClick={() => onDelete(message.id)}
						>
							Delete
						</button>
					)}
					<button className="copy mr-2" onClick={() => onCopy(message.id)}>
						Copy
					</button>

					{!readOnly && onRegenerate && (
						<button
							className="regenerate mr-2"
							onClick={() => onRegenerate(message.id)}
						>
							Regenerate
						</button>
					)}
				</span>
				<div className="flex items-center">
					{!!message.images?.length && (
						<ImgCarousel
							images={message.images}
							defaultExpanded={defExpandImages}
						/>
					)}
					{editingMsg === message.id ? (
						<textarea
							className="input w-96"
							value={tempMsgContent}
							onChange={(e) => setTempMsgContent(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && e.shiftKey) {
									handleMessageEdit(message.id, tempMsgContent);
								}
							}}
						/>
					) : message.type === 'thought' && !isThoughtCollapsed ? (
						<div
							className="thought-message"
							onClick={() => toggleCollapse(message.id)}
						>
							Thought...
						</div>
					) : (
						<span
							ref={contentRef}
							className={
								message.type === 'thought' ? 'thought-message' : 'message'
							}
							onClick={() => {
								if (message.type === 'thought') {
									toggleCollapse(message.id);
								} else if (!readOnly) {
									setEditingMsg(message.id);
									setTempMsgContent(message.content);
								}
							}}
						>
							{message.content}
						</span>
					)}
				</div>
			</div>
		</div>
	);
};

export default MessageItem;
