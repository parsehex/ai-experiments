import { v4 } from 'uuid';
import * as ooba from './ooba-api';

interface Message {
	id: string;
	role: string;
	content: string;
}
export function parseResponse(response: string): Message[] {
	const lines = response.split('\n');
	// does the first line have a colon after some uppercase text?
	// if not
	if (lines[0].match(/$[A-Z ]+:/)) {
		lines.shift();
	}
	const newMessages: Message[] = [];
	lines.forEach((line) => {
		const separatorIndex = line.indexOf(':');
		const tLine = line.trim();
		// there shouldn't be more than maybe 2 spaces before the colon
		// if there's more than 2 spaces, it's probably an action
		// if there's no colon, it's probably an action
		const spaceCount = line.substring(0, separatorIndex).split(' ').length;
		if (separatorIndex > -1 && spaceCount <= 2) {
			const role = line.substring(0, separatorIndex).trim().toUpperCase();
			const content = line.substring(separatorIndex + 1).trim();
			newMessages.push({
				id: v4(),
				role,
				content,
			});
		} else if (tLine) {
			// } else if (
			// 	(tLine.startsWith('[') && tLine.endsWith(']')) ||
			// 	(tLine.startsWith('(') && tLine.endsWith(')'))
			// ) {
			// If the line starts and ends with square brackets, treat it as an action/narrative
			// remove brackets
			const content = tLine;
			// const content = tLine.substring(1, tLine.length - 1).trim();
			newMessages.push({
				id: v4(),
				role: 'ACTION',
				content,
			});
		}
	});
	console.log(response, newMessages);
	return newMessages;
}

export async function initializeModel(preferredModels: string[]) {
	const info = await ooba.modelInfo();
	const modelLoaded =
		info.result.model_name && info.result.model_name !== 'None';

	if (!modelLoaded) {
		const modelListResponse = await ooba.listModels();
		const availableModels = modelListResponse.result;
		if (!availableModels.length) {
			console.error('No models available. Is the models drive mounted/picked?');
			return;
		}

		const modelToLoad = availableModels.find((avModel) =>
			preferredModels.some((prefModel) => avModel.includes(prefModel))
		);

		if (modelToLoad) {
			const loadResponse = await ooba.loadModel(modelToLoad);
			// loading often takes a while, so might not see this before page reload
			console.log('Model loaded:', loadResponse);
		} else {
			console.error('Preferred model not found in available models.');
		}
	}
}
