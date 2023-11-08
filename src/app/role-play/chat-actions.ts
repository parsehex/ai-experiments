import { v4 } from 'uuid';
import * as ooba from '@/lib/ooba-api';
import { GenerateParams } from '@/lib/types/ooba';
import { parseResponse } from '@/lib/ooba-utils';
import { Message } from '@/lib/types';
import { delay } from '@/lib/utils';
import { testPrompts } from './prompts';

interface MessagesOptions {
	messages: Message[];
	setMessages: (value: any) => void;
}

interface CharacterOptions {
	selectedCharacter: string;
}

interface InputOptions {
	setInput: (value: any) => void;
	input: string;
}

interface OneAtATimeOption {
	oneAtATime: boolean;
}

interface ShowOtherButtonsOption {
	setShowOtherButtons: (value: any) => void;
}

interface MainButtonOption {
	mainButton: string;
}

interface ConstructPromptOptions {
	constructPrompt: (
		msgs?: Message[],
		customDescription?: string,
		descOrder?: 'prepend' | 'append' | false
	) => string;
}

const baseParams: Partial<GenerateParams> = {
	temperature: 0.75,
	max_new_tokens: 512,
	guidance_scale: 1.25,
	repetition_penalty: 1.25,
	repetition_penalty_range: 64,
};
type MessageHandlerOptions = MessagesOptions &
	CharacterOptions &
	InputOptions &
	OneAtATimeOption &
	ShowOtherButtonsOption &
	MainButtonOption &
	ConstructPromptOptions;
class MessageHandler {
	options: MessageHandlerOptions;
	isGenerating = false;
	constructor(options: any) {
		this.options = {
			...options,
		};
	}

	handleAdd = () => {
		const { messages, setMessages, selectedCharacter, setInput, input } =
			this.options;
		const newMessage: Message = {
			id: v4(),
			role: selectedCharacter || 'ACTION',
			content: input,
		};
		setMessages([...messages, newMessage]);
		setInput('');
	};

	handleSend = async (tryNum = 0) => {
		if (this.isGenerating) {
			console.warn('A generation request is already in progress.');
			return;
		}
		this.isGenerating = true;
		const {
			messages,
			setMessages,
			selectedCharacter,
			setInput,
			input,
			oneAtATime,
			constructPrompt,
		} = this.options;
		const userInput = input;
		setInput('');

		const newMessage: Message = {
			id: v4(),
			role: selectedCharacter,
			content: userInput,
		};
		if (!newMessage.role) {
			newMessage.role = 'ACTION';
		}

		let updatedMessages = [...messages, newMessage];

		setMessages(updatedMessages);
		const promptToSend = constructPrompt(updatedMessages);

		const options: GenerateParams = Object.assign({}, baseParams, {
			prompt: promptToSend,
		});
		if (oneAtATime) {
			options.stopping_strings = [selectedCharacter || '\n'];
		}
		if (tryNum === 4) {
			// last try, try banning the STOP token
			options.ban_eos_token = true;
		}
		const result = await ooba.generateText(options);
		let response = result?.results[0]?.text || '';
		response = response.trim();
		console.log(response);

		const generatedMessages = parseResponse(response);
		if (response && generatedMessages.length > 0) {
			updatedMessages = [...updatedMessages, ...generatedMessages];
			console.log(updatedMessages);
			setMessages(updatedMessages);
		} else {
			console.log('No messages generated, retrying...');
			if (tryNum > 5) return;
			await delay(50);
			this.isGenerating = false;
			this.handleSend(tryNum + 1);
		}
		this.isGenerating = false;
	};

	handleContinue = async (count = 0, msgs?: Message[]) => {
		if (this.isGenerating) {
			console.warn('A generation request is already in progress.');
			return;
		}
		this.isGenerating = true;
		const { messages, setMessages, constructPrompt } = this.options;
		msgs = msgs || messages;
		const prompt = constructPrompt(
			messages,
			'Continue the conversation based on the following. Your response should start with a character NAME, or be an action/narrative desribing what is happening.',
			'prepend'
		);
		const options = Object.assign({}, baseParams, {
			prompt,
		});
		if (count === 1) {
			options.stopping_strings = ['\n'];
		}

		const result = await ooba.generateText(options);
		let response = result?.results[0]?.text || '';
		response = response.trim();

		const generatedMessages = parseResponse(response);
		const diff = generatedMessages.length - count;
		if (count > 0) generatedMessages.splice(count);
		if (diff < 0) {
			console.log('Not enough messages generated, retrying...');
			await delay(50);
			this.isGenerating = false;
			msgs = [...msgs, ...generatedMessages];
			this.handleContinue(count + diff, msgs);
			return;
		}
		if (response && generatedMessages.length > 0) {
			const updatedMessages = [...msgs, ...generatedMessages];
			setMessages(updatedMessages);
		} else {
			console.log('No messages generated, retrying...');
			await delay(50);
			this.isGenerating = false;
			this.handleContinue();
		}
		this.isGenerating = false;
	};

	handleFill = async () => {
		if (this.isGenerating) {
			console.warn('A generation request is already in progress.');
			return;
		}
		this.isGenerating = true;
		const { messages, selectedCharacter, setInput, input, constructPrompt } =
			this.options;
		let prompt = constructPrompt(
			messages,
			'Finish the last line based on the following conversation.',
			'prepend'
		).trim();
		prompt += '\n';
		const char = selectedCharacter;
		if (char) {
			prompt += `${char}: `;
		}
		if (input) {
			prompt += input.trim();
		}
		console.log(prompt);
		const options = Object.assign({}, baseParams, {
			prompt,
			ban_eos_token: true,
			stopping_strings: ['\n'],
		});
		if (char) {
			options.stopping_strings.push(char);
		}
		const result = await ooba.generateText(options);
		const response = result?.results[0]?.text || '';
		if (!response) {
			console.log('No response generated, retrying...');
			await delay(50);
			this.isGenerating = false;
			this.handleFill();
			return;
		}
		setInput(input + response);
		this.isGenerating = false;
	};

	regenerateMessage = async (msgId: string) => {
		if (this.isGenerating) {
			console.warn('A generation request is already in progress.');
			return;
		}
		this.isGenerating = true;
		const { constructPrompt, messages, setMessages } = this.options;
		const index = messages.findIndex((msg) => msg.id === msgId);

		const messagesUpToMsg = messages.slice(0, index);

		const prompt = constructPrompt(
			messagesUpToMsg,
			'Write the next line based on the following conversation.',
			'prepend'
		);
		const result = await ooba.generateText(
			Object.assign({}, baseParams, {
				prompt: prompt.trim() + '\n',
				temperature: 0.75,
				stopping_strings: ['\n'],
				ban_eos_token: true,
			})
		);
		const generatedMessage = parseResponse(result?.results[0]?.text.trim())[0];
		if (!generatedMessage) {
			console.log('No response generated, retrying...');
			await delay(50);
			this.isGenerating = false;
			this.regenerateMessage(msgId);
			return;
		}
		setMessages((prevMessages: any) => {
			return [
				...prevMessages.slice(0, index),
				generatedMessage,
				...prevMessages.slice(index + 1),
			];
		});
		this.isGenerating = false;
	};

	handleTest = async () => {
		this.options.setInput(
			testPrompts[Math.floor(Math.random() * testPrompts.length)]
		);
		this.handleSend();
	};

	handleMainAction = (mainButton: string) => {
		if (mainButton === 'Send') this.handleSend();
		else if (mainButton === 'Test') this.handleTest();
		else if (mainButton === 'Fill') this.handleFill();
		else if (mainButton === 'Add') this.handleAdd();
		else if (mainButton === 'Continue') this.handleContinue();
	};

	handleSelectAction = (action: string, count?: number) => {
		if (action === 'Send') this.handleSend();
		else if (action === 'Test') this.handleTest();
		else if (action === 'Fill') this.handleFill();
		else if (action === 'Add') this.handleAdd();
		else if (action === 'Continue') this.handleContinue(count);

		this.options.setShowOtherButtons(false);
	};
}

export const useMessageHandler = (options: MessageHandlerOptions) => {
	const handler = new MessageHandler(options);
	return handler;
};
