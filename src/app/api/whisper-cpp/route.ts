import { spawn } from 'child_process';
import { NextRequest } from 'next/server';
import { WhisperResultChunk } from '@/lib/types';

const WhisperCppPath = '/home/user/whisper.cpp';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		let inputFilePath = body.filepath;
		if (inputFilePath.includes(' ')) {
			inputFilePath = `"${inputFilePath}"`;
		}
		if (!inputFilePath) {
			return new Response('No filepath provided', { status: 400 });
		}

		return await new Promise<Response>((resolve, reject) => {
			let res = '';
			const parts: WhisperResultChunk[] = [];
			let cmd = `${WhisperCppPath}/main`;
			[
				'-m',
				`${WhisperCppPath}/models/ggml-base.bin`,
				'-f',
				`${inputFilePath}`,
				'-ml',
				'16',
			].forEach((arg) => {
				cmd += ` ${arg}`;
			});
			console.log('cmd', cmd);
			const whisperProcess = spawn(
				WhisperCppPath + '/main',
				[
					'-m',
					`${WhisperCppPath}/models/ggml-base.bin`,
					'-f',
					`${inputFilePath}`,
					'-ml',
					'16',
				],
				{
					stdio: ['ignore', 'pipe', 'pipe'],
				}
			);

			whisperProcess.stdout.on('data', (data) => {
				res += data;
			});
			// whisperProcess.stderr.on('data', (data) => {
			// 	res += data;
			// });

			whisperProcess.on('close', async (code) => {
				const lines = res.trim().split('\n');
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];
					const matches = line.match(
						/\[([0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}) --> ([0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3})\](.*)/
					);
					if (!matches) {
						continue;
					}
					let [, start, end, speech] = matches;
					// how many spaces at the start?
					// if 2, it's a continuation of the previous line
					let spaces = 0;
					for (let j = 0; j < speech.length; j++) {
						if (speech[j] === ' ') spaces++;
						else break;
					}
					speech = speech.trim();
					if (spaces >= 3 && i > 0) {
						speech = ' ' + speech;
					}
					parts.push({ start, end, speech });
				}
				resolve(
					new Response(JSON.stringify(parts), {
						headers: {
							'Content-Type': 'text/plain',
						},
					})
				);
			});
		});
	} catch (error) {
		console.error('Error:', error);
		return new Response('Conversion failed.', { status: 500 });
	}
}
