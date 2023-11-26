import { CustomBtns, Message } from '@/lib/types';
import React from 'react';
import ImgCarousel from '../ImgCarousel';
import TextInput from '../TextInput';

interface MessageItemProps {
	message: Message;
	index: number;
	isSelected: boolean;
	onToggleRole: (id: string) => void;
	onDelete?: (id: string) => void;
	onRegenerate?: (id: string) => void;
	onEdit: (id: string, content: string) => void;
	onCopy: (id: string) => void;
	hasSelect: boolean;
	onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
	readOnly: boolean;
	extraClass?: string;
	defExpandImages?: boolean;
	defExpandThoughts?: boolean;
	customBtns?: CustomBtns;
}

const MessageItem: React.FC<MessageItemProps> = ({
	message,
	index,
	isSelected,
	onToggleRole,
	onDelete,
	onRegenerate,
	onEdit,
	onCopy,
	hasSelect,
	onSelect,
	readOnly,
	extraClass = '',
	defExpandImages,
	defExpandThoughts,
	customBtns,
}) => {
	const isThought = message.type === 'thought';
	const [editingMsg, setEditingMsg] = React.useState<string | null>(null);
	const [tempMsgContent, setTempMsgContent] = React.useState<string>('');
	const [isThoughtCollapsed, setIsThoughtCollapsed] = React.useState(
		!defExpandThoughts
	);

	const canEdit = !readOnly && message.type !== 'thought';

	const toggleThoughtCollapse = () => {
		setIsThoughtCollapsed(!isThoughtCollapsed);
	};

	const handleMessageEdit = (id: string, content: string) => {
		onEdit(id, content);
		setEditingMsg(null);
	};

	const toggleRole = (id: string) => {
		onToggleRole(id);
	};

	const hasBtns = !!customBtns;
	const thoughtHasContent = isThought && message.content.length > 0;
	const msgHasContent =
		message.content.length > 0 || (message.images && message.images.length > 0);
	const btns = hasBtns ? Object.entries(customBtns!) : [];
	const MessageHeader = () => (
		<span className="message-header">
			<span
				className={`role ${message.role.toLowerCase().replace(/ /g, '_')}`}
				onClick={() => !readOnly && toggleRole(message.id)}
			>
				{message.role}
			</span>
			{!readOnly && onDelete && (
				<button className="delete mr-2" onClick={() => onDelete(message.id)}>
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

			{hasBtns && (
				<div className="flex">
					{btns.map(([name, btn]) => (
						<button
							key={name}
							className="custom-btn mr-2"
							onClick={() => btn(message.id)}
						>
							{name}
						</button>
					))}
				</div>
			)}
		</span>
	);
	const ThoughtHeader = () => (
		<span
			className={
				'thought-header ml-2 mr-2' +
				(thoughtHasContent ? ' cursor-pointer' : '')
			}
			onClick={() => {
				thoughtHasContent && toggleThoughtCollapse();
			}}
		>
			<span className="label">Thought</span>
			{message.thoughtLabel}
			{thoughtHasContent && (isThoughtCollapsed ? ' ▼' : ' ▲')}
		</span>
	);
	const MessageContent = () => (
		<div
			className={
				'flex items-center ml-1' +
				(isThought && isThoughtCollapsed ? '' : ' mt-1') +
				(!msgHasContent ? ' hidden' : '')
			}
		>
			{!!message.images?.length && (
				<ImgCarousel
					className="mr-1"
					images={message.images}
					defaultExpanded={defExpandImages}
				/>
			)}
			{editingMsg === message.id ? (
				<TextInput
					value={[tempMsgContent, setTempMsgContent]}
					canCopy={false}
					isTextarea
					onKeyDown={(e) => {
						if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
							handleMessageEdit(message.id, tempMsgContent);
						}
					}}
				/>
			) : (
				<span
					className={
						message.type === 'thought'
							? 'thought' +
							  (isThoughtCollapsed || !thoughtHasContent ? ' hidden' : '')
							: 'message-content'
					}
					onClick={(e) => {
						if (canEdit) {
							setEditingMsg(message.id);
							setTempMsgContent(message.content);
						}
						e.stopPropagation();
					}}
				>
					{message.content}
				</span>
			)}
		</div>
	);
	return (
		<div
			className={`message relative mb-1 flex items-center ${extraClass} ${
				(isSelected ? 'selected' : '') + (isThought ? ' thought' : '')
			}`}
			key={index}
		>
			<div className="header flex items-center">
				{hasSelect && (
					<input
						type="checkbox"
						// className="absolute top-2 left-2"
						checked={isSelected}
						onChange={(e) => onSelect(e)}
					/>
				)}

				{isThought ? <ThoughtHeader /> : <MessageHeader />}
			</div>
			<MessageContent />
		</div>
	);
};

export default MessageItem;
