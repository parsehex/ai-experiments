export type ItemProps = {
	title: string;
	description: string;
	href?: string;
	tags?: string[];
};

export const demos: ItemProps[] = [
	{
		title: 'Role Play',
		description: 'Character-based chat/role play without LangChain',
		href: '/role-play',
		tags: ['Chat', 'Story', 'In Progress', 'LLM'],
	},
	{
		title: 'Story Generator',
		description: 'Generate a story using a character, setting, and plot',
		href: '/story-generator',
		tags: ['Story', 'LLM', 'In Progress', 'Memory'],
	},
	{
		title: 'Thought Chain',
		description: 'Use LLM to answer questions in a multi-step process',
		href: '/thought-chain',
		// inspiration: https://old.reddit.com/r/LocalLLaMA/comments/17fmhcb/
		tags: ['LLM', 'In Progress'],
	},
	{
		title: 'Summarizer',
		description: 'Summarize collections of text',
		href: '/summarizer',
		tags: ['LLM', 'In Progress'],
	},
	{
		title: 'Conversational Summary Memory',
		description: 'Conversational memory without LangChain',
		href: '/conversational-summary',
		tags: ['Chat', 'LLM', 'In Progress', 'Memory'],
	},
	{
		title: 'Inner Monologue Chat',
		description: 'Chat where AI considers how to respond',
		href: '/inner-monologue',
		tags: ['Chat', 'LLM', 'In Progress'],
	},
	{
		title: 'Simple Chat',
		description: 'Simple chat meant to be a guide for other demos',
		href: '/simple-chat',
		tags: ['Chat', 'LLM', 'In Progress'],
	},
	{
		title: 'Redacter',
		description: 'Paste any text and remove identifying information',
		href: '/redacter',
		tags: ['LLM'],
	},
	{
		title: 'Transcribe Audio',
		description: 'Transcribe audio from file',
		href: '/transcribe-audio',
		tags: ['In Progress', 'Whisper'],
	},
	{
		title: 'Vision',
		description: 'Demo showing how to use vision models',
		// href: '/vision',
		tags: ['TODO'],
	},
	{
		title: 'Text to Speech',
		description: 'Text to speech utility',
		// href: '/text-to-speech',
		tags: ['TTS', 'TODO'],
	},
	{
		title: 'Suggestions',
		description:
			'Demo to try out generating suggestions to use in chat or other demos',
		// href: '/suggestions',
		tags: ['LLM', 'TODO'],
	},
	{
		title: 'LangChain Chat',
		description: 'Prototype chat app using LangChain',
		href: '/langchain-chat',
		tags: ['Chat', 'LLM', 'TODO'],
	},
	{
		title: 'Image Generator',
		description: 'Interface to Stable Diffusion for image generation',
		href: '/image-generator',
		tags: ['In Progress', 'SD'],
	},
	{
		title: 'Entity Memory',
		description: 'Entity memory for LangChain',
		href: '/entity-memory',
		tags: ['Chat', 'LLM', 'TODO'],
	},
	{
		title: 'Embeddings & Search',
		description: 'Search for similar documents using embeddings in a directory',
		// href: '/embeddings-search',
		tags: ['LLM', 'TODO'],
	},

	{
		title: 'Document QA',
		description:
			'Answer questions about a document, demo using vector stores, etc',
		// href: '/document-qa',
		tags: ['LLM', 'TODO'],
	},
	{
		title: 'Tools',
		description: 'Demonstrate giving the LLM tools to use',
		// href: '/tools',
		tags: ['LLM', 'TODO'],
	},
	{
		title: 'Chat Box',
		description: 'Reusable component for displaying a chat',
		href: '/chatbox-demo',
		tags: ['Component'],
	},
	{
		title: 'Test Prompt Button',
		description: 'Button to fill a random test prompt',
		href: '/test-prompts',
		tags: ['Component'],
	},
	{
		title: 'Model Status',
		description: 'Reusable component for managing the loaded model',
		href: '/model-status',
		tags: ['Component'],
	},
];
