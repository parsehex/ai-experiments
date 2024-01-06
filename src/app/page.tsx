'use client';
import AIModelStatus from '@/components/AIModelStatus';
import Collapsible from '@/components/Collapsible';
import { ItemProps, demos } from '@/demosList';
import React, { useState } from 'react';

const Item: React.FC<ItemProps> = ({ title, description, href, tags }) => (
	<li
		className={
			'flex items-center justify-start flex-col px-2 py-3 m-3 grow bg-gray-100 rounded-lg shadow hover:shadow-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700' +
			(href ? '' : ' opacity-40')
		}
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
			<Collapsible
				className="text-right"
				title="AI Server Statuses"
				titleSize="sm"
				defaultCollapsed={true}
			>
				<div>
					LLM: <AIModelStatus type="llm" inline />
				</div>
				<div>
					TTS: <AIModelStatus type="tts" inline />
				</div>
				<div>
					Img: <AIModelStatus type="img" inline />
				</div>
			</Collapsible>
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
