export type ItemProps = {
	title: string;
	description: string;
	href?: string;
	tags?: string[];
};

const tools: ItemProps[] = [
	{
		title: 'Image Generator',
		description: 'Interface to Stable Diffusion for image generation',
		href: '/image-generator',
		tags: ['Imagen', 'Tool'],
	},
	{
		title: 'Text to Speech',
		description: 'Text to speech utility',
		href: '/text-to-speech',
		tags: ['TTS', 'Tool'],
	},
	{
		title: 'Summarizer',
		description: 'Summarize collections of text',
		href: '/summarizer',
		tags: ['LLM', 'Tool'],
	},
	{
		title: 'Transcribe Audio',
		description: 'Transcribe audio from file',
		href: '/transcribe-audio',
		tags: ['Whisper', 'Tool'],
	},
	{
		title: 'Redacter',
		description: 'Paste any text and remove identifying information',
		href: '/redacter',
		tags: ['LLM', 'Tool'],
	},
	{
		title: 'Vision',
		description: 'Demo showing how to use vision models',
		// href: '/vision',
		tags: ['Tool'],
	},
	{
		title: 'Document QA',
		description:
			'Answer questions about a document, demo using vector stores, etc',
		// href: '/document-qa',
		tags: ['LLM', 'Tool'],
	},
];

const componentPrototypes: ItemProps[] = [
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
		tags: ['Component', 'LLM'],
	},
	{
		title: 'Suggestions',
		description:
			'Demo to try out generating suggestions to use in chat or other demos',
		// href: '/suggestions',
		tags: ['LLM', 'Component'],
	},
];

export const demos: ItemProps[] = [
	{
		title: 'Role Chat',
		description: 'Character-based chat/role play without LangChain',
		href: '/role-play',
		tags: ['Chat', 'Story', 'LLM'],
	},
	{
		title: 'Story Generator',
		description: 'Generate a story using a character, setting, and plot',
		href: '/story-generator',
		tags: ['Story', 'LLM', 'Memory'],
	},
	{
		title: 'Imagen Chat',
		description: 'Chat with the ability to generate images',
		href: '/imagen-chat',
		tags: ['Chat', 'LLM', 'Imagen', 'STT'],
	},
	{
		title: 'Speak Chat',
		description: 'Chat with end-to-end speech',
		// href: '/speak-chat',
		tags: ['Chat', 'LLM', 'STT'],
	},
	{
		// inspiration: https://old.reddit.com/r/LocalLLaMA/comments/17fmhcb/
		title: 'Thought Chain',
		description: 'Use LLM to answer questions in a multi-step process',
		href: '/thought-chain',
		tags: ['LLM'],
	},
	{
		title: 'Conversational Summary Memory',
		description: 'Conversational memory without LangChain',
		href: '/conversational-summary',
		tags: ['Chat', 'LLM', 'Memory'],
	},
	{
		title: 'Simple Chat',
		description: 'Simple chat meant to be a guide for other demos',
		href: '/simple-chat',
		tags: ['Chat', 'LLM', 'STT'],
	},
	{
		title: 'LangChain Chat',
		description: 'Prototype chat app using LangChain',
		href: '/langchain-chat',
		tags: ['Chat', 'LLM', 'LangChain'],
	},
	{
		title: 'Entity Memory',
		description: 'Entity memory',
		href: '/entity-memory',
		tags: ['Chat', 'LLM', 'Memory', 'LangChain'],
	},
	{
		title: 'Embeddings & Search',
		description: 'Search for similar documents using embeddings in a directory',
		// href: '/embeddings-search',
		tags: ['LLM'],
	},
	{
		title: 'Tools',
		description: 'Demonstrate giving the LLM tools to use',
		// href: '/tools',
		tags: ['LLM'],
	},
	...tools,
	...componentPrototypes,
];
