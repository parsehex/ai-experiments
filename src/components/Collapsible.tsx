import React, { useState, HTMLAttributes } from 'react';

export interface CollapsibleProps extends HTMLAttributes<HTMLDivElement> {
	title: string;
	titleSize?: 'sm' | 'md' | 'lg';
	children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({
	title,
	titleSize,
	children,
	...rest
}) => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	let titleClass = 'text-xl';
	switch (titleSize) {
		case 'sm':
			titleClass = 'text-sm';
			break;
		case 'md':
			titleClass = 'text-md';
			break;
		case 'lg':
			titleClass = 'text-lg';
			break;
	}

	return (
		<div {...rest}>
			<span
				className={`flex items-center cursor-pointer select-none ${titleClass}`}
				onClick={() => setIsCollapsed(!isCollapsed)}
			>
				{title} {isCollapsed ? '►' : '▼'}
			</span>
			{!isCollapsed && children}
		</div>
	);
};

export default Collapsible;
