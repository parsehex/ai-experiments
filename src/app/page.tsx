'use client';
import React, { useState } from 'react';

type ItemProps = {
	title: string;
	description: string;
	href?: string;
	tags?: string[];
};

const demos: ItemProps[] = [
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
		description: 'Interface to DALL-E 3 (for now)',
		// href: '/image-generator',
		tags: ['TODO'],
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
		title: 'Summarizer',
		description: 'Summarize collections of text',
		href: '/summarizer',
		tags: ['LLM', 'In Progress'],
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

const Item: React.FC<ItemProps> = ({ title, description, href, tags }) => (
	<li
		className="flex items-center justify-start flex-col px-2 py-3 m-3 grow bg-gray-100 rounded-lg shadow hover:shadow-lg border border-gray-300"
		style={{ maxWidth: '20%', minWidth: '150px' }}
	>
		{href ? (
			<a className="text-center block w-full underline" href={href}>
				{title}
			</a>
		) : (
			<span>{title}</span>
		)}
		<span className="text-sm text-gray-400 mt-2">{description}</span>
		<div className="flex flex-wrap">
			{tags?.map((tag) => (
				<span
					className="text-xs text-gray-500 m-1 p-1 bg-gray-200 rounded"
					key={`${title}-${tag}`}
				>
					{tag}
				</span>
			))}
		</div>
	</li>
);

const List = ({
	children,
	title,
	description,
}: {
	children: React.ReactNode;
	title?: string;
	description?: string;
}) => (
	<section className="flex flex-col items-center justify-center w-full">
		{title && <h2 className="text-2xl font-bold">{title}</h2>}
		{description && (
			<small
				className="italic text-gray-400"
				dangerouslySetInnerHTML={{ __html: description }}
			/>
		)}
		<ul className="flex flex-row w-full flex-wrap justify-center">
			{children}
		</ul>
	</section>
);

export default function Home() {
	const [selectedTag, setSelectedTag] = useState<string>('All');

	// Extract all unique tags from the demos for the filtering options
	const allTags = Array.from(new Set(demos.flatMap((demo) => demo.tags)));

	// Filter demos based on the selected tag
	const filteredDemos = demos.filter(
		(demo) => selectedTag === 'All' || demo.tags?.includes(selectedTag)
	);

	return (
		<main className="flex min-h-screen flex-col items-center p-12">
			<h3 className="text-3xl font-bold mb-4">AI Demos and Experiments</h3>
			<small className="text-gray-400 mb-4">
				A collection of AI-powered demos and experiments. Select a tag to filter
				the projects.
			</small>
			<div className="flex flex-wrap justify-center mb-4">
				<button
					className={`basic m-1 p-1 ${
						selectedTag === 'All' ? 'bg-blue-600' : 'bg-blue-500'
					}`}
					onClick={() => setSelectedTag('All')}
				>
					All
				</button>
				{allTags.map(
					(tag) =>
						tag && (
							<button
								key={tag}
								className={`basic m-1 p-1 ${
									selectedTag === tag ? 'bg-blue-600' : 'bg-blue-500'
								}`}
								onClick={() => setSelectedTag(tag)}
							>
								{tag}
							</button>
						)
				)}
			</div>
			<List
			// title="AI Demos and Experiments"
			// description="A collection of AI-powered demos and experiments. Select a tag to filter the projects."
			>
				{filteredDemos.map((demo) => (
					<Item key={demo.title} {...demo} />
				))}
			</List>
			{/* ... Any other sections you want to include ... */}
		</main>
	);
}
