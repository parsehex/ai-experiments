import { createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { NextRequest } from 'next/server';
import { File } from 'buffer';
import { lookup } from 'mime-types';
// @ts-ignore
import parseRTF from 'rtf-parser';
import { WhisperResultChunk } from '@/lib/types';

// export const config = {
// 	api: {
// 		bodyParser: false,
// 	},
// };

export async function POST(req: NextRequest) {
	try {
		const data = await req.formData();
		const file: File = data.get('file') as any;

		if (!file || Array.isArray(file) || !file?.stream) {
			return new Response('No file uploaded or incorrect file structure.', {
				status: 400,
			});
		}

		const inputFilePath = '/home/user/ai-experiments-data/' + file.name;
		const ext = file.name.split('.').pop();
		const outputFilePath = inputFilePath;
		const fileStream = createWriteStream(inputFilePath);
		await promisify(pipeline)(file.stream(), fileStream);
		const text = await fs.readFile(inputFilePath, 'utf-8');

		let res: any = { convertedText: '', type: '' };
		console.log('ext', ext);
		switch (ext) {
			case 'txt':
				res.convertedText = text;
				res.type = 'string';
				break;
			case 'doc':
			case 'docx':
				res.convertedText = await wordExtractor(inputFilePath);
				res.type = 'string';
				break;
			case 'rtf':
				res.convertedText = await rtfToText(text);
				res.type = 'rtf';
				break;
			case 'webm':
			case 'mp4':
			case 'mp3':
			case 'wav':
				res.convertedText = await audioToText(inputFilePath);
				res.type = 'whisper';
				break;
			default:
				return new Response('Unsupported file type.', { status: 400 });
		}

		return new Response(JSON.stringify(res), {
			status: 200,
			headers: {
				'Content-Type': 'text/plain',
				'Content-Disposition': `attachment; filename=${file.name}.txt`,
			},
		});

		// Cleanup: Optionally, delete the original and converted files
		await fs.unlink(inputFilePath);
		await fs.unlink(outputFilePath);
	} catch (error) {
		console.error('Error:', error);
		return new Response('Conversion failed.', { status: 500 });
	}
}

interface RTFForegroundObject {
	red: number;
	green: number;
	blue: number;
}
interface RTFFontObject {
	family: string;
	charset: number;
	name: string;
	pitch: number;
}
interface RTFStyleObject {
	font: RTFFontObject;
	foreground: RTFForegroundObject;
	align: 'left' | 'right' | 'center';
	fontSize: number;
}
export interface RTFContentObject {
	value: string;
	style: RTFStyleObject;
}
export interface RTFObject {
	style: RTFStyleObject;
	content: RTFContentObject[];
}
function rtfToText(fileStr: any): Promise<(RTFObject | RTFContentObject)[]> {
	return new Promise((resolve, reject) => {
		parseRTF.string(fileStr, (err: any, result: any) => {
			if (err) reject(err);
			resolve(result.content);
		});
	});
}
async function audioToText(filePath: string) {
	let wavPath: string;
	const filename = filePath.split('/').pop();
	const buffer = await fs.readFile(filePath);
	const fileType = lookup(filePath) || 'audio/webm';
	const content = new Blob([buffer], { type: fileType });

	// convert-to-wav converts to format whisper.cpp expects
	const data = new FormData();
	data.append('file', content, filename);
	const res = await fetch('http://localhost:8085/api/convert-to-wav', {
		method: 'POST',
		body: data,
	});
	const buf = await res.arrayBuffer();
	wavPath = filePath + '.wav';
	await fs.writeFile(wavPath, Buffer.from(buf));

	const res2 = await fetch('http://localhost:8085/api/whisper-cpp', {
		method: 'POST',
		body: JSON.stringify({ filepath: wavPath }),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	const parts: WhisperResultChunk[] = await res2.json();
	return parts;
}

async function wordExtractor(inputFilePath: string) {
	const WordExtractor = (await import('word-extractor')).default;
	const extractor = new WordExtractor();
	const doc = await extractor.extract(inputFilePath);
	return doc.getBody() as string;
}
