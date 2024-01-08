import React, { useEffect, useState } from 'react';
import TextInput from '@/components/TextInput';
import { getSpeakers, generateTTS, getVoices, speak } from '@/lib/tts';
import { Provider, Speaker } from '@/app/api/tts/types';

const TtsDemo: React.FC = () => {
	const [text, setText] = useState<string>('');
	const [voices, setVoices] = useState<string[]>([]);
	const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
	const [provider, setProvider] = useState<Provider>('XTTS');

	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const [isOnline, setIsOnline] = useState<boolean>(false);

	const refreshSpeakers = async () => {
		try {
			const voices = await getVoices();
			setIsOnline(true);
			setVoices(voices);
			setSelectedVoice(voices[0]);
		} catch (error) {
			setIsOnline(false);
		}
	};

	useEffect(() => {
		refreshSpeakers();
	}, []);
	useEffect(() => {
		if (provider) refreshSpeakers();
	}, [provider]);

	const handleGenerate = async () => {
		setIsGenerating(true);
		try {
			if (!selectedVoice) throw new Error('No voice selected');
			const start = Date.now();
			const audioData = await speak(text, selectedVoice);
			const audioUrl = URL.createObjectURL(audioData);
			setAudioUrl(audioUrl);
			const end = Date.now();
			console.log('Generated audio in', end - start, 'ms');
		} catch (error) {
			console.error('Error generating speech', error);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleDownload = () => {
		if (!audioUrl) return;
		const link = document.createElement('a');
		link.href = audioUrl;
		link.setAttribute('download', 'tts_output.mp3');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const Options = () => {
		return (
			<div>
				<label>
					Provider:
					<select
						id="tts-provider"
						value={provider}
						onChange={(e) => setProvider(e.target.value as Provider)}
					>
						<option value="XTTS">XTTS</option>
						<option value="OpenAI">OpenAI</option>
					</select>
				</label>
				{provider && (
					<label>
						Voice:
						<select
							id="tts-voice"
							value={selectedVoice || ''}
							onChange={(e) => {
								const i = voices.findIndex((voice) => voice === e.target.value);
								setSelectedVoice(voices[i]);
							}}
						>
							{voices.map((voice) => (
								<option key={voice} value={voice}>
									{voice}
								</option>
							))}
						</select>
					</label>
				)}
			</div>
		);
	};
	const Input = () => {
		return (
			<>
				<TextInput
					id="tts-input"
					label="Text"
					value={[text, setText]}
					isTextarea
				/>
				<button onClick={handleGenerate} disabled={isGenerating}>
					Generate
				</button>
			</>
		);
	};

	return (
		<div className="tts-demo">
			{!isOnline ? (
				<h2>TTS Offline</h2>
			) : (
				<>
					<Options />
					<Input />
					{audioUrl && (
						<div>
							<audio controls src={audioUrl}></audio>
							<button onClick={handleDownload}>Download</button>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default TtsDemo;
