export type PromptPart = {
	str: string;
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
	images?: ImgType[];
	thoughtLabel?: string;
	thoughtClass?: string;
}
// @ts-ignore
export interface ChatBoxMessage extends Message {
	content: string | Promise<string>;
}

export type PromptFormatResponse = string | Message[];
type PromptFormat = (user: string, system?: string) => PromptFormatResponse;
export interface PromptFormatsObj {
	[key: string]: PromptFormat;
}
