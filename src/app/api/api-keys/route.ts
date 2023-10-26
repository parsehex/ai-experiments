import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	console.log(
		'api-keys.ts: GET request.url',
		request.url,
		'process.env.OPENAI_API_KEY',
		process.env.OPENAI_API_KEY,
		'process.env.GOOGLE_API_KEY',
		process.env.GOOGLE_API_KEY,
		'process.env.GOOGLE_CSE_ID',
		process.env.GOOGLE_CSE_ID
	);
	return NextResponse.json({
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
		GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID,
	});
}
