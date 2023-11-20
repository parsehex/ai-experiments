import { GenerateOptions } from '../llm';

export interface Message {
	id: string;
	role: string;
	content: string;
	type?: 'message' | 'thought';
	images?: string[];
}

export type PhaseType = {
	name: string;
	template: string;
	variables: (
		input: string,
		previousResults: Record<string, string>
	) => Record<string, string>;
	extraParams?: GenerateOptions;
	processOutput?: (output: string) => string;
	shouldStop?: (output: string) => boolean;
};
