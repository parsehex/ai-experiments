import { CustomBtns, Message } from '@/lib/types';
import React from 'react';
import ImgCarousel from '../ImgCarousel';

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
	const contentRef = React.useRef(null as HTMLSpanElement | null);
	const [contentHeight, setContentHeight] = React.useState(0);
	const [editingMsg, setEditingMsg] = React.useState<string | null>(null);
	const [tempMsgContent, setTempMsgContent] = React.useState<string>('');
	const [isThoughtCollapsed, setIsThoughtCollapsed] = React.useState(
		!defExpandThoughts
	);

	const canEdit = !readOnly && message.type !== 'thought';

	const toggleThoughtCollapse = () => {
		setIsThoughtCollapsed(!isThoughtCollapsed);
	};

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

	const hasBtns = !!customBtns;
	const isThought = message.type === 'thought';
	// make array to iterate over
	const btns = hasBtns ? Object.entries(customBtns!) : [];
	return (
		<div
			className={`message relative mb-1 flex items-center ${extraClass} ${
				(isSelected ? 'selected' : '') + (isThought ? ' thought' : '')
			}`}
			key={index}
		>
			{hasSelect && (
				<input
					type="checkbox"
					className="absolute top-2 left-2"
					checked={isSelected}
					onChange={(e) => onSelect(e)}
				/>
			)}

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
				<div
					className="thought-header ml-6 cursor-pointer"
					style={{ display: message.type === 'thought' ? 'flex' : 'none' }}
					onClick={() => toggleThoughtCollapse()}
				>
					<span className="label">Thought</span>
					{message.thoughtLabel}
					{isThoughtCollapsed ? ' ▼' : ' ▲'}
				</div>
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
							onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
								if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
									handleMessageEdit(message.id, tempMsgContent);
								}
							}}
						/>
					) : (
						<span
							ref={contentRef}
							className={
								message.type === 'thought'
									? 'thought p-1' + (isThoughtCollapsed ? ' hidden' : '')
									: 'message'
							}
							onClick={() => {
								if (canEdit) {
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
