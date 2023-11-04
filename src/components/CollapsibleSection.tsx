/*
start from this:
<div>
	<h2
		className="flex items-center cursor-pointer"
		onClick={() => setIsCharactersCollapsed(!isCharactersCollapsed)}
	>
		Characters {isCharactersCollapsed ? '►' : '▼'}
	</h2>
	{!isCharactersCollapsed && characters.map(renderCharacterFields)}
	{!isCharactersCollapsed && (
		<span className="flex">
			<button onClick={handleAddCharacter}>Add Character</button>
			<HoverMenuButton
				label="Generate Characters"
				fields={addCharacterOptions}
				onSubmit={(v) => handleGenerateCharacters(v.numChars)}
			/>
		</span>
	)}
</div>
*/

import React, { useState } from 'react';

export interface CollapsibleSectionProps {
	title: string;
	children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
	title,
	children,
}) => {
	const [isCollapsed, setIsCollapsed] = useState(false);

	return (
		<div>
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
