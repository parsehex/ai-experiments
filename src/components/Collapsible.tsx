import React, { useState } from 'react';
import { CollapsibleProps } from './types';

const Collapsible: React.FC<CollapsibleProps> = ({
	title,
	titleSize,
	titleAlign = 'center',
	children,
	defaultCollapsed,
	inline,
	...rest
}) => {
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed ?? false);
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
	titleClass += ` text-${titleAlign}`;

	return (
		<div {...rest} className={`flex flex-col ${inline ? 'inline' : ''}`}>
			<div
				className={`max-w-full cursor-pointer select-none ${titleClass}`}
				onClick={() => setIsCollapsed(!isCollapsed)}
			>
				{title} {isCollapsed ? '►' : '▼'}
			</div>
			<div className={isCollapsed ? 'invisible max-h-3' : ''}>{children}</div>
		</div>
	);
};

export default Collapsible;
