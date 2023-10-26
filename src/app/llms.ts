import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAI } from 'langchain/llms/openai';

interface LLMMap {
	gpt35: ChatOpenAI | null;
	gpt4: ChatOpenAI | null;
	gpt35_openai: OpenAI | null;
	[modelName: string]: ChatOpenAI | OpenAI | null;
}

const llms: LLMMap = {
	gpt35: null as ChatOpenAI | null,
	gpt4: null as ChatOpenAI | null,
	gpt35_openai: null as OpenAI | null,
};

export function getLLM(modelName: 'gpt3', key: string): OpenAI;
export function getLLM(modelName: 'gpt35', key: string): ChatOpenAI;
export function getLLM(modelName: 'gpt4', key: string): ChatOpenAI;
export function getLLM(modelName: string, key?: string) {
	if (llms[modelName]) return llms[modelName];

	switch (modelName) {
		case 'gpt35': {
			llms[modelName] = new ChatOpenAI({
				openAIApiKey: key,
				modelName: 'gpt-3.5-turbo',
				temperature: 0,
			});
			break;
		}
		case 'gpt4': {
			llms[modelName] = new ChatOpenAI({
				openAIApiKey: key,
				modelName: 'gpt-4',
				temperature: 0,
			});
			break;
		}
		case 'gpt3': {
			llms[modelName] = new OpenAI({
				openAIApiKey: key,
				modelName: 'davinci',
				temperature: 0,
			});
			break;
		}
		default: {
			throw new Error(`Unknown model: ${modelName}`);
		}
	}
	return llms[modelName];
}
