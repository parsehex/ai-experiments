import React, { useState, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaStop } from 'react-icons/fa';
import axios from 'axios';
import { WhisperResultChunk } from '@/lib/types';

interface AudioToTextButtonProps {
	onResult: (result: WhisperResultChunk[]) => void;
}

const RecordButton: React.FC<AudioToTextButtonProps> = ({ onResult }) => {
	const [isRecording, setIsRecording] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);

	const handleStartRecording = async () => {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const mediaRecorder = new MediaRecorder(stream);
		mediaRecorderRef.current = mediaRecorder;
		mediaRecorder.start();

		const audioChunks: BlobPart[] = [];

		mediaRecorder.addEventListener('dataavailable', (event) => {
			audioChunks.push(event.data);
		});

		mediaRecorder.onstop = async (e) => {
			const audioData = new Blob(audioChunks, { type: 'audio/webm' });
			const formData = new FormData();
			formData.append('file', audioData, 'audio.webm');
			const response = await axios.post('/api/convert-to-text', formData);
			onResult(response.data.convertedText);
		};
	};

	const handleStopRecording = () => {
		mediaRecorderRef.current?.stop();
	};

	const handleClick = () => {
		if (!isRecording) {
			handleStartRecording();
		} else {
			handleStopRecording();
		}
		setIsRecording(!isRecording);
	};

	const btnClass = isRecording ? 'stop-record' : 'start-record';
	return (
		<button className={btnClass} onClick={handleClick}>
			{isRecording ? <FaStop /> : <FaMicrophone />}
		</button>
	);
};

export default RecordButton;
