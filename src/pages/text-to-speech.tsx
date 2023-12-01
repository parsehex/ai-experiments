import React, { useEffect, useState } from 'react';
import TextInput from '@/components/TextInput';
import { Provider, Speaker, getSpeakers, generateTTS } from '@/lib/tts';

const TtsDemo: React.FC = () => {
	const [text, setText] = useState<string>('');
	const [voices, setVoices] = useState<Speaker[]>([]);
	const [selectedVoice, setSelectedVoice] = useState<Speaker | null>(null);
	const [provider, setProvider] = useState<Provider>('XTTS');

	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const [isOnline, setIsOnline] = useState<boolean>(false);

	const refreshSpeakers = async () => {
		try {
			const speakers = await getSpeakers(provider);
			setIsOnline(true);
			setVoices(speakers);
			setSelectedVoice(speakers[0]);
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
			const audioData = await generateTTS(text, provider, selectedVoice.name);
			const audioUrl = URL.createObjectURL(audioData);
			setAudioUrl(audioUrl);
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
							value={selectedVoice?.name}
							onChange={(e) => {
								const i = voices.findIndex(
									(voice) => voice.name === e.target.value
								);
								setSelectedVoice(voices[i]);
							}}
						>
							{voices.map((voice) => (
								<option key={voice.name} value={voice.name}>
									{voice.name}
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
					{Options()}
					{Input()}
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
