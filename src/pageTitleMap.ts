const pageTitleMap: Record<string, string> = {
	'/': 'Home',
	'/character-chat': 'Character Chat',
	'/conversational-summary': 'Conversational Summary Chat',
	'/entity-memory': 'Entity Memory Chat',
	'/image-generator': 'Image Generator',
	'/imagen-chat': 'Imagen Chat',
	'/langchain-chat': 'Langchain Chat',
	'/redacter': 'Redacter',
	'/role-play': 'Role Play Chat',
	'/simple-chat': 'Simple Chat',
	'/simple-io': 'Simple I/O',
	'/story-generator': 'Story Generator',
	'/summarizer': 'Summarizer',
	'/transcribe-audio': 'Transcribe Audio',
	'/text-to-speech': 'Text to Speech',
	'/thought-chain': 'Thought Chain',
};

export const getPageTitle = (path: string) =>
	pageTitleMap[path] || 'Default Title';
