const Item = ({
	title,
	description,
	href,
}: {
	title: string;
	description: string;
	href?: string;
}) => (
	<li
		className="flex items-center justify-start flex-col p-2 m-3 grow"
		style={{ maxWidth: '20%', minWidth: '150px' }}
	>
		{href ? (
			<a className="block w-full" href={href}>
				{title}
			</a>
		) : (
			<span>{title}</span>
		)}
		<span className="text-sm text-gray-400 mt-2">{description}</span>
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
	return (
		<main className="flex min-h-screen flex-col items-center p-12">
			<List
				title="In Progress Demos"
				description="Demos in a usable state, <b>mostly</b> in order of how much they work"
			>
				<Item
					title="Role Play"
					description="Character-based chat/role play without LangChain"
					href="/role-play"
				/>
				<Item
					title="Thought Chain"
					description="Use LLM to answer questions in a multi-step process"
					href="/thought-chain"
					// inspiration: https://old.reddit.com/r/LocalLLaMA/comments/17fmhcb/
				/>
				<Item
					title="Conversational Summary Memory"
					description="Conversational memory without LangChain"
					href="/conversational-summary"
				/>
				<Item
					title="Inner Monologue Chat"
					description="Chat where AI considers how to respond"
					href="/inner-monologue"
				/>
				<Item
					title="Simple Chat"
					description="Simple chat meant to be a guide for other demos"
					href="/simple-chat"
				/>
				<Item
					title="Redacter"
					description="Paste any text and remove identifying information"
					href="/redacter"
				/>
				<Item
					title="Story Generator"
					description="Generate a story using a character, setting, and plot"
					href="/story-generator"
				/>
			</List>
			<List title="TODO">
				<Item
					title="LangChain Chat"
					description="Prototype chat app using LangChain"
					href="/langchain-chat"
				/>
				<Item
					title="Entity Memory"
					description="Entity memory for LangChain"
					href="/entity-memory"
				/>
				<Item
					title="Embeddings & Search"
					description="Search for similar documents using embeddings in a directory"
				/>
				<Item
					title="Code Summarizer"
					description="Summarize code"
					// href="/code-summarizer"
				/>
				<Item
					title="Document QA"
					description="Answer questions about a document, demo using vector stores, etc"
					// href="/document-qa"
				/>
				{/* After: Make library to allow using different LLMs that works across the different demos */}
				<Item
					title="Tools"
					description="Demonstrate giving the LLM tools to use"
				/>
			</List>
			<List title="Component Demos">
				<Item
					title="Chat Box"
					description="Reusable component for displaying a chat"
					href="/chatbox-demo"
					// TODO NOTES: add some options and make the options configurable on the page
				/>
				<Item
					title="Test Prompt Button"
					description="Button to fill a random test prompt"
					href="/test-prompts"
				/>
				<Item
					title="Model Status"
					description="Reusable component for managing the loaded model"
					// TODO NOTES: by default if model is loaded, show as just a green dot. if model is loading, show as a yellow dot. if model is not loaded, show as a red dot. hover to reveal a menu for choosing a model to load.
					//   make a standalone demo first, then make it a component to be added to other pages
				/>
			</List>
		</main>
	);
}
