import { LLMChain, SequentialChain } from 'langchain/chains';
import { GoogleCustomSearch, Tool } from 'langchain/tools';
import { WebBrowser } from 'langchain/tools/webbrowser';
import { getLLM } from './llms';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

interface ToolMap {
	gsearch: GoogleCustomSearch | null;
	browser: WebBrowser | null;
	[toolName: string]: Tool | null;
}

const tools: ToolMap = {
	gsearch: null as GoogleCustomSearch | null,
	browser: null as WebBrowser | null,
};
// overloads:
export function getTool(
	toolName: 'gsearch',
	key: string,
	cseId: string
): GoogleCustomSearch;
export function getTool(toolName: 'browser', key: string): WebBrowser;
export function getTool(toolName: string, key: string, cseId?: string) {
	if (tools[toolName]) return tools[toolName];
	switch (toolName) {
		case 'gsearch': {
			if (!key) console.error('Missing GOOGLE_API_KEY');
			if (!cseId) console.error('Missing GOOGLE_CSE_ID');
			if (!key || !cseId) break;
			tools[toolName] = new GoogleCustomSearch({
				apiKey: key,
				googleCSEId: cseId,
			});
			break;
		}
		case 'browser': {
			if (!key) {
				console.error('Missing OPENAI_API_KEY');
				break;
			}
			tools[toolName] = new WebBrowser({
				model: getLLM('gpt4', key),
				embeddings: new OpenAIEmbeddings({ openAIApiKey: key }),
			});
			break;
		}
		default: {
			console.error(`Unknown tool: ${toolName}`);
		}
	}
	return tools[toolName];
}
