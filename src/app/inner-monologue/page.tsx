'use client';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types';
import { generate } from '@/lib/llm';
import { makePrompt } from '@/lib/llm/prompts';
import { txt2img, txt2imgResponseInfo } from '@/lib/imagen';
import { toast } from 'react-toastify';

const RANCFG_MIN = 1;
const RANCFG_MAX = 6;

const DefaultLLMParams = {
	temp: 0.7,
	top_p: 0.9,
	max: 256,
	top_k: 20,
	repetition_penalty: 1.15,
	stop: ['RESPONSE:', 'INPUT:'],
};

const GET_RANDOM_CFG = () =>
	Math.random() * (RANCFG_MAX - RANCFG_MIN) + RANCFG_MIN;

const pickSampler = (ran = true) => {
	const choices = ['Euler a', 'LMS Karras', 'UniPC'];
	if (!ran) return choices[0];
	return choices[Math.floor(Math.random() * choices.length)];
};

const innerMonologue = async (messages: Message[]) => {
	let prompt =
		'Consider the entire chat history and prepare thoughts on how to respond:\n';
	messages.forEach((message) => {
		prompt += `${message.role}: ${message.content}\n`;
	});
	prompt += 'THOUGHTS: ';

	const result = await generate(
		prompt,
		Object.assign({}, DefaultLLMParams, {
			temp: 0.5,
			cfg: 2,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
			ban_eos_token: true,
		})
	);
	console.log('thought', prompt, result);
	return result;
};
const summarizeChat = async (messages: Message[], lastSummary = '') => {
	let instructions =
		'The following INPUT is a chat between a user and an assistant.\n';
	if (lastSummary) {
		instructions += `Your task is to revise the previous summary based on the new chat. Retain the most important information from the previous summary.\n`;
		instructions += `Previous Summary: ${lastSummary}\n`;
	} else {
		instructions += 'Your task is to summarize the chat.\n';
	}
	instructions += 'Respond with a string containing the summary only.\n';
	const inputStr = `INPUT:\n${messages
		.map((msg) => `${msg.role}: ${msg.content}`)
		.join('\n')}\n`;
	const prompt = makePrompt(inputStr, instructions, 'ChatML');
	const result = await generate(
		prompt,
		Object.assign({}, DefaultLLMParams, {
			prefixResponse: 'SUMMARY:',
			max: 256,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	toast.success('Summary generated');
	return result;
};

const isImageRequestThoughts = async (
	message: Message,
	lastMsg?: Message,
	summary = ''
) => {
	let instructions = 'The following INPUT is a message from the user.\n';
	instructions +=
		'Your task is to decide whether or not the user requested to generate an image. Be slightly overzealous in choosing to generate an image.\n';
	instructions += 'Think out loud before answering.\n';
	if (lastMsg) {
		// instructions += `Previous Message${
		// 	!!lastMsg.images?.length ? ' (image was generated)' : ''
		// }:\n${lastMsg.role}: ${lastMsg.content}\n`;
		instructions += 'Previous Message:\n';
		instructions += `<|im_start|>assistant\n${lastMsg.content}\n`;
		instructions += !!lastMsg.images?.length ? '(you generated an image)' : '';
	}
	if (summary) {
		instructions += `Chat Summary: ${summary}\n`;
	}
	const inputStr = `INPUT: ${message.content}\n`;
	const prompt = makePrompt(inputStr, instructions, 'ChatML');
	const result = await generate(
		prompt,
		Object.assign({}, DefaultLLMParams, {
			prefixResponse: 'THOUGHTS:',
			// cfg: 1.25,
			// temp: 0.25,
			max: 96,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	return result.trim();
};
const isImageRequest = async (
	message: Message,
	lastMsg?: Message,
	summary = ''
) => {
	const thoughts = await isImageRequestThoughts(message, lastMsg, summary);
	console.log('thoughts', thoughts);
	let instructions = 'The following INPUT is a message from the user.\n';
	instructions +=
		'Your task is to decide whether or not the user requested to generate an image. They might have asked explicitly or implicitly (e.g. asking to see something).\n';
	// instructions += 'Be lenient in answering in the affirmative.\n';
	if (lastMsg) {
		// TODO <|im_start|>assistant is a hack
		instructions += `Previous Message:\n<|im_start|>assistant\n${
			!!lastMsg.images?.length ? ' (image was generated)' : ''
		}\n${lastMsg.content}\n`;
	}
	// if (summary) {
	// 	// TODO
	// 	instructions += `The following is a summary of the chat so far, which might help you decide: ${summary}\n`;
	// }
	instructions += 'Respond with YES or NO.\n';
	const inputStr = `INPUT: ${message.content}\n`;
	const prompt = makePrompt(inputStr, instructions, 'ChatML');
	let result = await generate(
		prompt,
		Object.assign({}, DefaultLLMParams, {
			prefixResponse: 'RESPONSE:\n' + thoughts + '\nANSWER:\n',
			// cfg: 1.25,
			max: 5,
			stop: ['RESPONSE:', 'INPUT:'],
		})
	);
	result = result.trim().toUpperCase();
	return { result, thoughts };
};
const makeImagePrompt = async (
	desc: string,
	prevPrompt = '',
	thoughts = ''
) => {
	let instructions = 'The following INPUT is a message requesting an image.\n';
	instructions +=
		'Your task is to write the prompt that will be used to generate the image. The prompt should start with a long phrase describing what the overall image depicts, and then lists visual descriptors separated by commas to further refine the image.\n';
	instructions +=
		'To emphasize a keyword or phrase, include its synonyms or wrap it in (parentheses).\n';
	if (prevPrompt) {
		instructions += `Past Prompt: ${prevPrompt}\n`;
	}
	instructions += 'Respond with a string containing the prompt only.\n';
	const inputStr = `INPUT: ${desc}\n`;
	const prompt = makePrompt(inputStr, instructions, 'ChatML');
	let result = await generate(
		prompt,
		Object.assign({}, DefaultLLMParams, {
			prefixResponse: 'RESPONSE:' + (thoughts ? `\n${thoughts}\nANSWER: ` : ''),
			max: 256,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	result = result.trim().replace(/"/g, '');
	// llm likes to use emojies, remove
	result = result.replace(/[\uD800-\uDFFF]./g, '');
	return result;
};

interface ExtraObj {
	thoughts?: string;
	madeImage?: boolean;
	summary?: string;
}

const sendInput = async (
	input: string,
	messages: Message[],
	{ thoughts, madeImage, summary: s }: ExtraObj = {}
) => {
	const msgs = messages.map((msg) => `${msg.role}: ${msg.content}`);
	// remove the last message, which is the user's input
	msgs.pop();
	// limit history to last 5 messages + summary
	const chatHistory = msgs.slice(-5).join('\n');
	const thoughtStr = thoughts
		? `\nThese are your thoughts on how to respond: ${thoughts}`
		: '';
	const imgStr = madeImage
		? '\n(You created an image which the user received. There is no action necessary on your part, do not include placeholder text.)'
		: '';
	let instructions =
		'Continue the following chat between USER and ASSISTANT by responding to the INPUT.\n';
	instructions += 'Respond with a string containing your response only.\n';
	instructions += `HISTORY ${
		msgs.length > 5 ? '(last 5)' : `(last ${msgs.length})`
	}:\n${chatHistory}\n`;
	if (s) instructions += `CHAT SUMMARY: ${s}\n`;
	instructions += `${thoughtStr}\n`;
	// instructions += imgStr;
	const user = `INPUT: ${input}\n`;
	const prompt = makePrompt(user, instructions, 'ChatML');
	let prefixResponse = 'RESPONSE:';
	if (madeImage) {
		prefixResponse =
			'(Assistant created an image that was shown to the user.)\n';
		prefixResponse += 'RESPONSE:';
		prefixResponse += 'Sure, here is your image. ';
	}
	const result = await generate(
		prompt,
		Object.assign({}, DefaultLLMParams, {
			prefixResponse,
			max: 768,
			temp: 0.25,
			cfg: 1.5,
			stop: ['INPUT:', 'RESPONSE:', 'USER:'],
			// mirostat_mode: 2,
		})
	);
	return result;
};

interface Options {
	wide: boolean;
	expandImages: boolean;
	cfg: number;
	randomCfg: boolean;
	randomSampler: boolean;
}
const DefaultOptions: Options = {
	wide: true,
	expandImages: true,
	cfg: 4.5,
	randomCfg: false,
	randomSampler: true,
};

function InnerMonologueChat() {
	const [messages, setMessages] = useState<Message[]>([
		{
			role: 'ASSISTANT',
			content: 'Hi, what do you want to talk about?',
			id: uuidv4(),
		},
	]);
	const [chatSummary, setChatSummary] = useState('');
	const [input, setInput] = useState('');
	const [options, setOptions] = useState(DefaultOptions);
	const [lastPrompt, setLastPrompt] = useState('');
	const [lastInfo, setLastInfo] = useState({} as txt2imgResponseInfo);

	const updateSummary = async (msgs = messages) => {
		// call this after every message, only actually summarize after
		//   maybe 4 messages, at least eventually
		const summary = await summarizeChat(msgs, chatSummary);
		setChatSummary(summary);
		// console.log('summary', summary);
	};

	// user sends a message
	const handleSend = async (userInput: string) => {
		if (!userInput) {
			toast.error('Please enter a message');
			return;
		}
		setInput('');

		let newMessages = [
			...messages,
			{ role: 'USER', content: userInput, id: uuidv4() },
		];
		const userMsg = newMessages[newMessages.length - 1];
		setMessages(newMessages);

		// const msgThoughts = await innerMonologue(newMessages);
		// newMessages.push({
		// 	role: 'ASSISTANT',
		// 	content: msgThoughts,
		// 	id: uuidv4(),
		// 	type: 'thought',
		// });
		// setMessages(newMessages);

		let image: string | undefined;
		let seed = -1;

		const lastMsg = newMessages[newMessages.length - 2];

		const imgReq = await isImageRequest(userMsg, lastMsg || null, chatSummary);
		const isImgReq = imgReq.result.includes('YES');
		const imgThoughts = imgReq.thoughts;
		let infoparams: txt2imgResponseInfo;
		toast.info('Is image request: ' + imgReq.result);
		if (isImgReq) {
			const prompt = await makeImagePrompt(userMsg.content, lastPrompt);
			setLastPrompt(prompt);
			const res = await txt2img({
				prompt,
				negative_prompt: 'easynegative',
				sampler_name: pickSampler(options.randomSampler),
				cfg_scale: options.randomCfg ? GET_RANDOM_CFG() : options.cfg,
				batch_size: 1,
				n_iter: 1,
				steps: 20,
				width: 512,
				height: 768,
			});
			infoparams = JSON.parse(res.info);
			setLastInfo(infoparams);
			image = res.images[0];
		}

		const response = await sendInput(userInput, newMessages, {
			madeImage: !!image,
		});
		toast.success('Response generated');
		const aiMessage: Message = {
			role: 'ASSISTANT',
			content: response,
			id: uuidv4(),
		};
		if (image) {
			aiMessage.images = [{ url: image, prompt: lastInfo.prompt, seed }];
		}
		newMessages = [...newMessages, aiMessage];
		setMessages(newMessages);
		updateSummary(newMessages);
	};

	const handleClear = () => {
		console.clear();
		setMessages([]);
		setInput('');
		setChatSummary('');
		toast.success('Console cleared');
	};

	const generateImg = async (
		prompt: string,
		seed: number,
		cfg: number,
		sampler: string,
		steps = 20
	) => {
		const res = await txt2img({
			prompt,
			negative_prompt: 'easynegative',
			sampler_name: sampler,
			cfg_scale: cfg,
			seed,
			batch_size: 1,
			n_iter: 1,
			steps,
			width: 512,
			height: 768,
		});
		const info: txt2imgResponseInfo = JSON.parse(res.info);
		const image = res.images[0];
		return { image, info };
	};

	const regenerateMessage = async (
		id: string,
		keepPrompt = false,
		onlyImage = true
	) => {
		const msg = messages.find((msg) => msg.id === id);
		if (!msg) return;
		const lastMsg = messages[messages.indexOf(msg) - 2];
		const inputMsg = messages[messages.indexOf(msg) - 1];
		if (!inputMsg) {
			toast.error('No input message found');
			return;
		}
		const imgReq = await isImageRequest(inputMsg, lastMsg || null, chatSummary);
		toast.info('Is image request: ' + imgReq.result);
		const isImgReq = imgReq.result.includes('YES');
		const imgThoughts = imgReq.thoughts;
		if (!isImgReq && onlyImage) return;
		let prompt = '';
		let seed = -1;
		if (keepPrompt && typeof msg.images !== 'string') {
			prompt = lastPrompt;
			// @ts-ignore
			seed = msg.images[0].seed || lastInfo.seed;
		} else {
			prompt = await makeImagePrompt(
				inputMsg.content,
				lastMsg?.content
				// imgThoughts
				// need to generate new thoughts
			);
			toast.info('Regenerated prompt');
			setLastPrompt(prompt);
		}

		const opt = {
			cfg: options.randomCfg ? GET_RANDOM_CFG() : options.cfg,
			sampler: pickSampler(options.randomSampler),
		};

		toast.info('Regenerating image...');
		const { image, info } = await generateImg(
			prompt,
			seed,
			opt.cfg,
			opt.sampler
		);
		toast.success('Generated image');
		setLastInfo(info);
		// console.log('prompt', prompt);
		const newMessages = messages.map((msg) => {
			if (msg.id === id) {
				msg.images = [{ url: image, prompt, seed: info.seed }];
			}
			return msg;
		});
		setMessages(newMessages);
	};

	const regenerateImage = async (
		msgId: string,
		steps = 20,
		verbatim = false,
		keepPrompt = true,
		cfg?: number,
		sampler?: string
	) => {
		const msg = messages.find((msg) => msg.id === msgId);
		if (!msg) return;
		const lastMsg = messages[messages.indexOf(msg) - 2];
		const inputMsg = messages[messages.indexOf(msg) - 1];
		if (!inputMsg) return;
		let prompt = '';
		let seed = -1;
		toast.info('Regenerating image...');
		if ((keepPrompt || verbatim) && typeof msg.images !== 'string') {
			prompt = lastPrompt;
			// @ts-ignore
			seed = msg.images[0].seed || lastInfo.seed;
		} else {
			const thoughts = await isImageRequestThoughts(
				inputMsg,
				lastMsg || null,
				chatSummary
			);
			prompt = await makeImagePrompt(
				inputMsg.content,
				lastMsg?.content,
				thoughts
			);
			setLastPrompt(prompt);
			toast.info('Generated prompt...');
		}

		const opt = {} as any;
		if (verbatim) {
			opt.cfg = lastInfo.cfg_scale;
			opt.sampler = lastInfo.sampler_name;
		} else {
			if (cfg) opt.cfg = cfg;
			else opt.cfg = options.randomCfg ? GET_RANDOM_CFG() : options.cfg;
			if (sampler) opt.sampler = sampler;
			else opt.sampler = pickSampler(options.randomSampler);
		}

		const { image, info } = await generateImg(
			prompt,
			seed,
			opt.cfg,
			opt.sampler,
			steps
		);
		setLastInfo(info);
		toast.success('Generated image');
		const newMessages = messages.map((msg) => {
			if (msg.id === msgId) {
				msg.images = [{ url: image, prompt, seed: info.seed }];
			}
			return msg;
		});
		setMessages(newMessages);
	};

	return (
		<div className={`inner-monologue-chat ${options.wide ? '' : 'container'}`}>
			<div>
				<button className="delete" onClick={handleClear}>
					Clear
				</button>
				<button
					className="green"
					onClick={() => {
						localStorage.setItem(
							'inner-monologue-chat',
							JSON.stringify(messages)
						);
						localStorage.setItem(
							'inner-monologue-chat-options',
							JSON.stringify(options)
						);
					}}
				>
					Save
				</button>
				<button
					className="basic"
					onClick={() => {
						// load messages from ls
						const lsChat = localStorage.getItem('inner-monologue-chat');
						const lsOptions = localStorage.getItem(
							'inner-monologue-chat-options'
						);
						if (lsChat) {
							setMessages(JSON.parse(lsChat));
							const opts = lsOptions ? JSON.parse(lsOptions) : {};
							setOptions({ ...DefaultOptions, ...opts });
						}
					}}
				>
					Load
				</button>
				<label>
					Wide
					<input
						type="checkbox"
						checked={options.wide}
						onChange={(e) => setOptions({ ...options, wide: e.target.checked })}
					/>
				</label>
				<label>
					Expand Images
					<input
						type="checkbox"
						checked={options.expandImages}
						onChange={(e) =>
							setOptions({ ...options, expandImages: e.target.checked })
						}
					/>
				</label>
				<label>
					CFG
					<input
						type="number"
						className={`ml-2 ${options.randomCfg ? 'disabled' : ''}`}
						step={0.25}
						min={1}
						value={options.cfg}
						onChange={(e) => setOptions({ ...options, cfg: +e.target.value })}
						disabled={options.randomCfg}
					/>
				</label>
				<input
					type="checkbox"
					title="Random CFG"
					checked={options.randomCfg}
					onChange={(e) =>
						setOptions({ ...options, randomCfg: e.target.checked })
					}
				/>
				<label>
					Random Sampler
					<input
						type="checkbox"
						checked={options.randomSampler}
						onChange={(e) =>
							setOptions({ ...options, randomSampler: e.target.checked })
						}
					/>
				</label>
			</div>
			<ChatBox
				messages={messages}
				setMessages={setMessages}
				handleSend={handleSend}
				regenerateMessage={(id) => {
					regenerateMessage(id, false, false);
				}}
				deleteMessage={(id) => {
					setMessages(messages.filter((msg) => msg.id !== id));
				}}
				handleEdit={(id, content) => {
					setMessages(
						messages.map((msg) => {
							if (msg.id === id) {
								msg.content = content;
							}
							return msg;
						})
					);
				}}
				defExpandImages={options.expandImages}
				customBtns={{
					'Regen Image': (id) => regenerateImage(id, 20, false, true),
					// Variation: should be near the same image
					Variation: (id) =>
						regenerateImage(id, 20, false, true, GET_RANDOM_CFG()),
					// Better: same image but more steps
					Better: (id) => regenerateImage(id, 30, true),
				}}
			/>
			{lastInfo && (
				<div className="last-prompt flex">
					{chatSummary && (
						<p>
							Summary: <span>{chatSummary}</span>
						</p>
					)}
					{lastInfo.prompt && (
						<p>
							Last Prompt: <span>{lastInfo.prompt}</span>
						</p>
					)}
				</div>
			)}
		</div>
	);
}

export default InnerMonologueChat;
