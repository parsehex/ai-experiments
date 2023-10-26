export function DescriptionTextArea({
	description,
	setDescription,
}: {
	description: string;
	setDescription: (description: string) => void;
}) {
	return (
		<textarea
			className="description input mr-2"
			value={description}
			onChange={(e) => setDescription(e.target.value)}
			placeholder="Optional description..."
		/>
	);
}
