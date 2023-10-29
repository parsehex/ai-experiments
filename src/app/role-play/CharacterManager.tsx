export function CharacterManager({
	characters,
	addCharacter,
	removeCharacter,
	editCharacter,
	editingChar,
	setEditingChar,
	tempCharName,
	setTempCharName,
}: {
	characters: string[];
	addCharacter: (newCharacter: string) => void;
	removeCharacter: (character: string) => void;
	editCharacter: (oldCharacter: string, newCharacter: string) => void;
	editingChar: string | null;
	setEditingChar: (editingChar: string | null) => void;
	tempCharName: string;
	setTempCharName: (tempCharName: string) => void;
}) {
	return (
		<div className="characters-management">
			{characters.map((char, index) => (
				<div key={index} className="character-item">
					{editingChar === char ? (
						<input
							className="input"
							value={tempCharName}
							onChange={(e) => setTempCharName(e.target.value)}
							onBlur={() => {
								editCharacter(char, tempCharName);
								setEditingChar(null);
							}}
						/>
					) : (
						<span
							onClick={() => {
								setEditingChar(char);
								setTempCharName(char);
							}}
						>
							{char}
						</span>
					)}
					<button onClick={() => removeCharacter(char)}>Remove</button>
				</div>
			))}
			<button
				onClick={() => addCharacter(prompt('Enter new character name:') || '')}
			>
				Add Character
			</button>
		</div>
	);
}
