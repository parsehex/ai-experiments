const pageTitleMap: Record<string, string> = {
	'/': 'Home',
	'/conversational-summary': 'Conversational Summary Chat',
	'/entity-memory': 'Entity Memory Chat',
	'/image-generator': 'Image Generator',
	'/inner-monologue': 'Inner Monologue Chat',
	'/langchain-chat': 'Langchain Chat',
	'/redacter': 'Redacter',
	'/role-play': 'Role Play Chat',
	'/simple-chat': 'Simple Chat',
	'/story-generator': 'Story Generator',
	'/summarizer': 'Summarizer',
	'/thought-chain': 'Thought Chain',
};

export const getPageTitle = (path: string) =>
	pageTitleMap[path] || 'Default Title';