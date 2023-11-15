import { createWriteStream, promises as fs } from 'fs';
import { spawn } from 'child_process';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { NextRequest } from 'next/server';
import { File } from 'buffer';
// @ts-ignore
import parseRTF from 'rtf-parser';

export const config = {
	api: {
		bodyParser: false,
	},
};

export async function POST(req: NextRequest) {
	try {
		const data = await req.formData();
		const file: File = data.get('file') as any;
		console.log('file', file);

		if (!file || Array.isArray(file) || !file?.stream) {
			return new Response('No file uploaded or incorrect file structure.', {
				status: 400,
			});
		}

		const inputFilePath = '/home/user/ai-experiments-data/' + file.name;
		const outputFilePath = inputFilePath + '.txt';

		const fileStream = createWriteStream(inputFilePath);
		await promisify(pipeline)(file.stream(), fileStream);

		// get file as text
		const text = await fs.readFile(inputFilePath, 'utf-8');

		// Example using a hypothetical 'unrtf' Node.js package
		// You need to replace this with actual RTF to text conversion logic
		const convertedText = await convertRtfToText(text);
		const res = JSON.stringify({ convertedText });

		return new Response(res, {
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

// Placeholder function - Implement based on the RTF parsing library/tool you choose
async function convertRtfToText(fileStream: any) {
	return new Promise((resolve, reject) => {
		parseRTF.string(fileStream, (err: any, result: any) => {
			if (err) {
				reject(err);
			}
			resolve(result.content);
		});
	});
}
