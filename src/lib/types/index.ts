import { GenerateOptions } from '../llm';

interface ImageObj {
	url: string;
	prompt?: string;
	seed?: string | number;
}
export type ImgType = string | ImageObj;

export interface Message {
	id: string;
	role: string;
	content: string;
	type?: 'message' | 'thought';
	thoughtLabel?: string;
	thoughtClass?: string;
	images?: ImgType[];
}

type BtnCallback = (id: string) => void;
export interface CustomBtns {
	[key: string]: BtnCallback;
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
