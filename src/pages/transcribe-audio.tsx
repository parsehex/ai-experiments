'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { addCorsIfNot } from '@/lib/utils';
import RecordButton from '@/components/RecordButton';
import { WhisperResultChunk } from '@/lib/types';

const TranscribeAudio: React.FC = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [transcription, setTranscription] = useState<string | null>(null);
	const [diarize, setDiarize] = useState<boolean>(false);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			setSelectedFile(event.target.files[0]);
		}
	};

	const handleFormSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!selectedFile) return;
		const formData = new FormData();
		// formData.append('diarize', diarize.toString());
		formData.append('file', selectedFile);

		try {
			const base = addCorsIfNot('http://localhost:5000/', 5000);
			const response = await axios.post(
				`${base}stt/v1/transcribe?diarize=${diarize}`,
				formData,
				{
					headers: { 'Content-Type': 'multipart/form-data' },
				}
			);
			// response has `parts` array of objects
			// each object has `speech`, `start`/`end` and `speaker` (empty string if diarize=false)

			// let text = '';
			// for (let i = 0; i < response.data.parts.length; i++) {
			// 	const part = response.data.parts[i];
			// 	text += part.speech;
			// 	if (i < response.data.parts.length - 1) {
			// 		text += ' ';
			// 	}
			// }
			// setTranscription(text.trim());
			transcribed(response.data.parts);
		} catch (error) {
			console.error('Error uploading file and getting transcription', error);
		}
	};

	const handleConversionSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!selectedFile) return;

		const formData = new FormData();
		formData.append('file', selectedFile);

		try {
			const response = await axios.post('/api/convert-to-wav', formData, {
				responseType: 'blob',
			});

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const downloadLink = document.createElement('a');
			downloadLink.href = url;
			downloadLink.setAttribute(
				'download',
				`converted_${selectedFile.name}.wav`
			);
			downloadLink.click();
			window.URL.revokeObjectURL(url); // Clean up the URL object
		} catch (error) {
			console.error('Error converting file', error);
		}
	};

	const transcribed = (result: WhisperResultChunk[]) => {
		let text = '';
		// need slightly clever logic for constructing the string
		// - most chunks are separated by a space
		// - if the next chunk starts with an apostrophe or comma, don't add a space
		// TODO probably switch to whisper-cpp-python https://pypi.org/project/whisper-cpp-python/
		// (looks to have timestamps)
		for (let i = 0; i < result.length; i++) {
			const chunk = result[i];
			if (chunk.speaker) text += `[${chunk.speaker}]: `;
			text += chunk.speech;
			if (i < result.length - 1) {
				const nextChunk = result[i + 1];
				if (nextChunk.speech.match(/^[',]/)) {
					continue;
				}
				text += '\n';
			}
		}
		setTranscription(text);
	};

	return (
		<div className="flex">
			<div className="inline-flex">
				<div>
					<h3>Tools</h3>
					{/* <div>
						<h4>Audio Converter</h4>
						<form onSubmit={handleConversionSubmit}>
							<input type="file" accept="audio/*" onChange={handleFileChange} />
							<button type="submit" className="basic">
								Convert to WAV
							</button>
						</form>
					</div> */}
					<div>
						<RecordButton onResult={(result) => transcribed(result)} />
					</div>
				</div>
				<div>
					<h3>TODO</h3>
					<ul>
						<li>Change Whisper options in ui (model, language, prompt)</li>
					</ul>
				</div>
			</div>
			<div className="inline-flex">
				<form onSubmit={handleFormSubmit}>
					<label>
						Diarize
						<input
							type="checkbox"
							checked={diarize}
							onChange={() => setDiarize(!diarize)}
						/>
					</label>
					<input type="file" accept="audio/*" onChange={handleFileChange} />
					<button type="submit" className="basic">
						Transcribe Audio
					</button>
				</form>
				{transcription && (
					<div>
						<h2>Transcription:</h2>
						<p className="whitespace-pre-line">{transcription}</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default TranscribeAudio;
