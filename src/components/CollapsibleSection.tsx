import React, { useState, HTMLAttributes } from 'react';

export interface CollapsibleSectionProps
	extends HTMLAttributes<HTMLDivElement> {
	title: string;
	children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
	title,
	children,
	...rest
}) => {
	const [isCollapsed, setIsCollapsed] = useState(false);

	return (
		<div {...rest}>
			<h2
				className="flex items-center cursor-pointer"
				onClick={() => setIsCollapsed(!isCollapsed)}
			>
				{title} {isCollapsed ? '►' : '▼'}
			</h2>
			{!isCollapsed && children}
		</div>
	);
};

export default CollapsibleSection;
