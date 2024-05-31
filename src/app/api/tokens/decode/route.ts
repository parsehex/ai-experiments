import { NextRequest, NextResponse } from 'next/server';
import { get_encoding } from 'tiktoken';

const encoding = get_encoding('cl100k_base');

export async function POST(req: NextRequest) {
	const body = await req.json();
	if (!body.tokens) {
		return new Response('No tokens provided', { status: 400 });
	}
	const text = encoding.decode(body.tokens);
	const obj = { text };
	return NextResponse.json(obj);
}
