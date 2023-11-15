import { NextRequest, NextResponse } from 'next/server';
import { get_encoding } from 'tiktoken';

const encoding = get_encoding('cl100k_base');

export async function POST(req: NextRequest) {
	const input = await req.text();
	const obj = { length: encoding.encode(input) };
	return NextResponse.json(obj);
}
