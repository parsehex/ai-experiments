import { PromptPart, PromptPartResponse } from '@/lib/types/llm';

export function sendPrompt(): PromptPartResponse {
	const system: PromptPart[] = [];
	const user: PromptPart[] = [];
	const prefixResponse = '';
	return { prefixResponse, system, user };
}
