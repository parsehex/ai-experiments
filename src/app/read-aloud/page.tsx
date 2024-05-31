'use client';
import React, { useState } from 'react';
import { speak } from '@/lib/tts';
import { toast } from 'react-toastify';
import TTSVoiceSelector from '@/components/TTSVoiceSelector';
import TextInput from '@/components/TextInput';
import AudioPlayer from '@/components/AudioPlayer';

function ReadAloudDemo() {
	// TODO URL for scraping text
	const [text, setText] = useState<string>('');
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [voice, setVoice] = useState<string>('default');

	const handleReadAloud = async () => {
		const audioData = await speak(text, voice);
		const audioUrl = URL.createObjectURL(audioData);
		setAudioUrl(audioUrl);
		console.log('audioUrl', audioUrl, audioData);
	};

	const handleReadFromClipboard = async () => {
		try {
			const clipboardText = await navigator.clipboard.readText();
			setText(clipboardText);
		} catch (error) {
			toast.error('Error reading from clipboard (try Chrome?)');
		}
	};

	return (
		<div className="read-aloud-demo">
			<TextInput
				id="read-aloud-input"
				value={[text, setText]}
				placeholder="Paste text here or click the button to read from clipboard"
				isTextarea
			/>
			<TTSVoiceSelector value={voice} onChange={setVoice} />
			<button onClick={handleReadAloud}>Read Aloud</button>
			<button onClick={handleReadFromClipboard}>Read from Clipboard</button>
			<AudioPlayer audioUrl={audioUrl} />
		</div>
	);
}

export default ReadAloudDemo;
