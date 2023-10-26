const Item = ({
	title,
	description,
	href,
}: {
	title: string;
	description: string;
	href?: string;
}) => (
	<li className="flex items-center justify-center flex-col p-8">
		{href ? (
			<a className="block w-full" href={href}>
				{title}
			</a>
		) : (
			<span>{title}</span>
		)}
		<span className="text-sm text-gray-400">{description}</span>
	</li>
);
const List = ({
	children,
	title,
}: {
	children: React.ReactNode;
	title?: string;
}) => (
	<section className="flex flex-col items-center justify-center">
		{title && <h2 className="text-2xl font-bold">{title}</h2>}
		<ul className="flex flex-col items-center justify-center lg:flex-row">
			{children}
		</ul>
	</section>
);

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center p-24">
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
			</List>
			<List title="TODO">
				<Item
					title="Entity Memory"
					description="Entity memory for LangChain"
					href="/chat/entity-memory"
				/>
				<Item
					title="Thought Chains"
					description="Demo using LLM to answer questions in a multi-step process"
					// inspiration: https://old.reddit.com/r/LocalLLaMA/comments/17fmhcb/
				/>
				<Item
					title="Model Component"
					description="Reusable component for managing the loaded model"
					// TODO NOTES: by default if model is loaded, show as just a green dot. if model is loading, show as a yellow dot. if model is not loaded, show as a red dot. hover to reveal a menu for choosing a model to load.
					//   make a standalone demo first, then make it a component to be added to other pages
				/>
			</List>
		</main>
	);
}
