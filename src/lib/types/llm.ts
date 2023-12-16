export type PromptPart = {
	val: string;
	if?: boolean; // Determines whether this part should be included
	pre?: string; // A string to prepend to the content if the condition is true
	suf?: string; // A string to append to the content if the condition is true
};
export interface PromptPartResponse {
	user: PromptPart[];
	system?: PromptPart[];
	prefixResponse?: string;
	grammar?: string;
}

/** The format that chat LLMs/ChatGPT expect. */
export interface RawMessage<RoleType = string> {
	role: RoleType;
	content: string;
}

interface ImageObj {
	url: string;
	prompt?: string;
	seed?: string | number;
}
export type ImgType = string | ImageObj;
/** A more general object for this app to use. */
export interface Message {
	id: string;
	role: string;
	content: string;
	type: 'message' | 'thought';
	images: ImgType[];
	thoughtLabel?: string;
	thoughtClass?: string;
}
// how can we update Message to support keeping a history of edits to the content?
// allow content to be an object? could have an array for the history, and a selected index
// also tts? user will want to be able to regenerate tts, so similar needs
// makes sense to me to keep tts alongside the content used to generate it

// @ts-ignore
export interface ChatBoxMessage extends Message {
	content: string | Promise<string>;
}

export type PromptFormatResponse = string | RawMessage[];
type PromptFormat = (user: string, system?: string) => PromptFormatResponse;
export interface PromptFormatsObj {
	[key: string]: PromptFormat;
}
