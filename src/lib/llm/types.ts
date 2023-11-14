export type PromptPart = {
	str: string;
	if?: boolean; // Determines whether this part should be included
	pre?: string; // A string to prepend to the content if the condition is true
	suf?: string; // A string to append to the content if the condition is true
};

export interface Message<RoleType = string> {
	role: RoleType;
	content: string;
}
export type PromptFormatResponse = string | Message[];
type PromptFormat = (user: string, system?: string) => PromptFormatResponse;
export interface PromptFormatsObj {
	[key: string]: PromptFormat;
}
