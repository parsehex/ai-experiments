import React, { useState } from 'react';
import axios from 'axios';
import { cors } from '@/lib/utils';

const TranscribeAudio: React.FC = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [transcription, setTranscription] = useState<string | null>(null);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			setSelectedFile(event.target.files[0]);
		}
	};

	const handleFormSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!selectedFile) return;
		const formData = new FormData();
		formData.append('file', selectedFile);

		try {
			const response = await axios.post(
				cors('http://localhost:5000/v1/audio/transcriptions'),
				formData,
				{
					headers: { 'Content-Type': 'multipart/form-data' },
				}
			);
			setTranscription(response.data.text);
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

	return (
		<div className="flex">
			<h2>
				Note: This demo relies on the new, OpenAI-compatible API for Oobabooga,
				cannot be used with its old one.
			</h2>
			<div className="inline-flex">
				<div>
					<h3>Tools</h3>
					<div>
						<h4>Audio Converter</h4>
						<form onSubmit={handleConversionSubmit}>
							<input type="file" accept="audio/*" onChange={handleFileChange} />
							<button type="submit" className="basic">
								Convert to WAV
							</button>
						</form>
					</div>
				</div>
				<div>
					<h3>TODO</h3>
					<ul>
						<li>Auto-convert to wav before transcribing</li>
						<li>Change Whisper options in ui (model, language, prompt)</li>
					</ul>
				</div>
				h
			</div>
			<div className="inline-flex">
				<form onSubmit={handleFormSubmit}>
					<input type="file" accept="audio/*" onChange={handleFileChange} />
					<button type="submit" className="basic">
						Transcribe Audio
					</button>
				</form>
				{transcription && (
					<div>
						<h2>Transcription:</h2>
						<p>{transcription}</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default TranscribeAudio;
