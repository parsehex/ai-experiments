export function ChatOptions({
	oneAtATime,
	setOneAtATime,
}: {
	oneAtATime: boolean;
	setOneAtATime: (oneAtATime: boolean) => void;
}) {
	return (
		<div className="chat-options flex-1">
			<label>
				<input
					type="checkbox"
					checked={oneAtATime}
					onChange={() => setOneAtATime(!oneAtATime)}
				/>
				<span>One At A Time</span>
			</label>
		</div>
	);
}
