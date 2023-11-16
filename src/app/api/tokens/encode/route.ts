import { NextRequest, NextResponse } from 'next/server';
import { get_encoding } from 'tiktoken';

const encoding = get_encoding('cl100k_base');

export async function POST(req: NextRequest) {
	const body = await req.json();
	if (!body.text) {
		return new Response('No text provided', { status: 400 });
	}
	const tokens = encoding.encode(body);
	const obj = { tokens, length: tokens.length };
	return NextResponse.json(obj);
}
