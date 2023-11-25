import { createWriteStream, promises as fs } from 'fs';
import { spawn } from 'child_process';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { NextRequest } from 'next/server';
import { File } from 'buffer';

export const config = {
	api: {
		bodyParser: false,
	},
};

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
		const outputFilePath = inputFilePath + '.wav';

		const fileStream = createWriteStream(inputFilePath);
		await promisify(pipeline)(file.stream(), fileStream);

		return await new Promise<Response>((resolve, reject) => {
			const ffmpegProcess = spawn(
				'ffmpeg',
				[
					'-i',
					inputFilePath,
					'-f',
					'wav',
					'-ar',
					'16000',
					'-ac',
					'1',
					outputFilePath,
					'-y',
				],
				{
					stdio: ['ignore', 'ignore', 'pipe'],
				}
			);

			ffmpegProcess.on('close', async (code) => {
				if (code !== 0) {
					reject(new Response('Conversion failed.', { status: 500 }));
					return;
				}

				try {
					const data = await fs.readFile(outputFilePath);
					resolve(
						new Response(data, {
							status: 200,
							headers: {
								'Content-Type': 'audio/wav',
								'Content-Disposition': `attachment; filename=${file.name}.wav`,
							},
						})
					);

					await fs.unlink(inputFilePath);
					await fs.unlink(outputFilePath);
				} catch (readError) {
					reject(new Response('File read or cleanup failed.', { status: 500 }));
				}
			});
		});
	} catch (error) {
		console.error('Error:', error);
		return new Response('Conversion failed.', { status: 500 });
	}
}
