import React, { useEffect, useState } from 'react';
import { getVoices } from '@/lib/tts';

interface TTSVoiceSelectorProps {
	value: string;
	onChange: (value: string) => void;
}

const TTSVoiceSelector: React.FC<TTSVoiceSelectorProps> = ({
	value,
	onChange,
}) => {
	const [voices, setVoices] = useState<string[]>([]);

	useEffect(() => {
		const fetchVoices = async () => {
			const voices = await getVoices();
			setVoices(voices);
		};

		fetchVoices();
	}, []);

	return (
		<select value={value} onChange={(e) => onChange(e.target.value)}>
			{voices.map((voice) => (
				<option key={voice} value={voice}>
					{voice}
				</option>
			))}
		</select>
	);
};

export default TTSVoiceSelector;
