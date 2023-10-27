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
		className="flex items-center justify-center flex-col p-2 m-3 grow"
		style={{ maxWidth: '20%', minWidth: '200px' }}
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
}: {
	children: React.ReactNode;
	title?: string;
}) => (
	<section className="flex flex-col items-center justify-center w-full">
		{title && <h2 className="text-2xl font-bold">{title}</h2>}
		<ul className="flex flex-row w-full flex-wrap justify-center">
			{children}
		</ul>
	</section>
);

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center p-12">
			<List title="In Progress">
				<Item
					title="Role Play"
					description="Character-based chat/role play without LangChain"
					href="/chat/role-play"
				/>
				<Item
					title="Redacter"
					description="Paste any text and remove identifying information"
					href="/redacter"
				/>
				<Item
					title="Chat using LangChain"
					description="Prototype chat app using LangChain"
					href="/chat"
				/>
				<Item
					title="Thought Chain"
					description="Use LLM to answer questions in a multi-step process"
					href="/thought-chain"
					// inspiration: https://old.reddit.com/r/LocalLLaMA/comments/17fmhcb/
				/>
			</List>
			<List title="TODO">
				<Item
					title="Entity Memory"
					description="Entity memory for LangChain"
					href="/chat/entity-memory"
				/>
				<Item
					title="Conversational Memory"
					description="Conversational memory without LangChain"
					// href="/chat/conversational-memory"
				/>
				<Item
					title="Model Status Component"
					description="Reusable component for managing the loaded model"
					// TODO NOTES: by default if model is loaded, show as just a green dot. if model is loading, show as a yellow dot. if model is not loaded, show as a red dot. hover to reveal a menu for choosing a model to load.
					//   make a standalone demo first, then make it a component to be added to other pages
				/>
				{/* After: Make library to allow using different LLMs that works across the different demos */}
				<Item
					title="Tools"
					description="Demonstrate giving the LLM tools to use"
				/>
			</List>
			<List title="Task List">
				<li>
					Add a central, site-wide place to set up things like API keys - Could
					just make a page to manage localstorage? Would that break SSR?
				</li>
			</List>
		</main>
	);
}
