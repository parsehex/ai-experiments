import React, { useState } from 'react';
import RootLayout from '@/components/Layout';

const prompts = {
	simple: [
		"What's your name?",
		'How old are you?',
		"What's your favorite color?",
	],
	multiStepQuestions: [
		'Tell me about a time when you faced a challenge.',
		'Can you describe a project you worked on?',
	],
};

const TestPromptPage = () => {
	const [currentPrompt, setCurrentPrompt] = useState('');

	const handleGeneratePrompt = () => {
		const promptType = Math.random() < 0.5 ? 'simple' : 'multiStepQuestions';
		const prompt =
			prompts[promptType][
				Math.floor(Math.random() * prompts[promptType].length)
			];
		setCurrentPrompt(prompt);
	};

	return (
		<main>
			<h1>Test Prompt Page</h1>
			<button onClick={handleGeneratePrompt}>Test</button>
			{currentPrompt && <p>{currentPrompt}</p>}
		</main>
	);
};

TestPromptPage.getLayout = (page: React.ReactNode) => {
	return <RootLayout>{page}</RootLayout>;
};

export default TestPromptPage;
