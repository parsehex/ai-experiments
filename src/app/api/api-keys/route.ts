import { NextResponse } from 'next/server';

export async function GET() {
	const obj: Record<string, string> = {};
	if (process.env.OPENAI_API_KEY)
		obj.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
	if (process.env.GOOGLE_API_KEY)
		obj.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
	if (process.env.GOOGLE_CSE_ID)
		obj.GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
	return NextResponse.json(obj);
}
