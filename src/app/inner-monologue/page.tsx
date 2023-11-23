'use client';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types';
import { GenerateOptions, generate } from '@/lib/llm';
import { makePrompt } from '@/lib/llm/prompts';
import { txt2img, txt2imgResponseInfo } from '@/lib/imagen';
import { toast } from 'react-toastify';
import * as parts from './prompt-parts';
import { Choices } from '@/lib/llm/grammar';

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
const Params = (p: GenerateOptions): GenerateOptions =>
	Object.assign({}, DefaultLLMParams, p);

const GET_RANDOM_CFG = () =>
	Math.random() * (RANCFG_MAX - RANCFG_MIN) + RANCFG_MIN;

const pickSampler = (ran = true) => {
	const choices = ['Euler a', 'LMS Karras', 'UniPC'];
	if (!ran) return choices[0];
	return choices[Math.floor(Math.random() * choices.length)];
};

const genInnerMonologue = async (messages: Message[]) => {
	messages = messages.filter((msg) => msg.type !== 'thought');
	const promptParts = parts.innerMonologue({ messages });
	const { prefixResponse, user, system } = promptParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
			cfg: 2,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
			ban_eos_token: true,
		})
	);
	return result;
};
const genSummarizeChat = async (messages: Message[], lastSummary = '') => {
	messages = messages.filter((msg) => msg.type !== 'thought');
	const promptParts = parts.summarizeChat({ messages, lastSummary });
	const { prefixResponse, user, system } = promptParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	toast.success('Summary generated');
	return result;
};

const genIsImgReqThoughts = async (
	message: Message,
	lastMsg?: Message,
	summary = ''
) => {
	const promptParts = parts.isImageRequestThoughts({
		message,
		lastMsg,
		summary,
	});
	const { prefixResponse, user, system } = promptParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
			max: 96,
			stop: ['RESPONSE:', 'INPUT:', '\n'],
		})
	);
	return result.trim();
};
const genIsImgReq = async (
	message: Message,
	lastMsg?: Message,
	summary = ''
) => {
	const thoughts = await genIsImgReqThoughts(message, lastMsg, summary);
	const promptParts = parts.isImageRequestAnswer({
		message,
		thoughts,
		lastMsg,
	});
	const { prefixResponse, user, system } = promptParts;
	let result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
			max: 5,
			grammar: Choices(['YES', 'NO']),
		})
	);
	result = result.trim().toUpperCase();
	return { result, thoughts };
};
const genImgPrompt = async (desc: string, prevPrompt = '', thoughts = '') => {
	const promptParts = parts.makeImgPrompt({ desc, prevPrompt, thoughts });
	const { prefixResponse, user, system } = promptParts;
	let result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
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

const genContinueChat = async (
	input: string,
	messages: Message[],
	{ thoughts, madeImage, summary }: ExtraObj = {}
) => {
	messages = messages.filter((msg) => msg.type !== 'thought');
	const promptParts = parts.continueChat({
		input,
		messages,
		thoughts,
		madeImage,
		summary,
	});
	const { prefixResponse, user, system } = promptParts;
	const result = await generate(
		makePrompt(user, system, 'ChatML'),
		Params({
			prefixResponse,
			max: 768,
			// temp: 0.25,
			cfg: 1.5,
			// stop: ['INPUT:', 'RESPONSE:', 'USER:'],
		})
	);
	return result;
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

const aiThoughtMessage = (thoughts: string, label = 'Thoughts'): Message => ({
	id: uuidv4(),
	role: 'ASSISTANT',
	content: thoughts,
	type: 'thought',
	thoughtLabel: label,
});

interface Options {
	wide: boolean;
	expandImages: boolean;
	cfg: number;
	randomCfg: boolean;
	randomSampler: boolean;
}
const DefaultOptions: Options = {
	wide: false,
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
		const summary = await genSummarizeChat(msgs, chatSummary);
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

		let image: string | undefined;
		let seed = -1;

		const lastMsg = newMessages[newMessages.length - 2];

		const imgReq = await genIsImgReq(userMsg, lastMsg || null, chatSummary);
		const imgThoughts = imgReq.thoughts;
		const iirtMsg = aiThoughtMessage(
			imgThoughts,
			'Is Image Request: ' + imgReq.result
		);
		newMessages = [...newMessages, iirtMsg];
		setMessages(newMessages);
		const isImgReq = imgReq.result.includes('YES');
		let infoparams: txt2imgResponseInfo;
		if (isImgReq) {
			const prompt = await genImgPrompt(userMsg.content, lastPrompt);
			setLastPrompt(prompt);
			const imgPromptMsg = aiThoughtMessage(prompt, 'Image Prompt');
			newMessages = [...newMessages, imgPromptMsg];
			setMessages(newMessages);
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

		const response = await genContinueChat(userInput, newMessages, {
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
		setLastPrompt('');
		toast.success('Console cleared');
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
		const imgReq = await genIsImgReq(inputMsg, lastMsg || null, chatSummary);
		const isImgReq = imgReq.result.includes('YES');
		const imgThoughts = imgReq.thoughts;
		if (!isImgReq) return;
		let prompt = '';
		let seed = -1;
		if (keepPrompt && typeof msg.images !== 'string') {
			prompt = lastPrompt;
			// @ts-ignore
			seed = msg.images[0].seed || lastInfo.seed;
		} else {
			prompt = await genImgPrompt(
				inputMsg.content,
				lastMsg?.content
				// imgThoughts
				// need to generate new thoughts
			);
			setLastPrompt(prompt);
		}

		const opt = {
			cfg: options.randomCfg ? GET_RANDOM_CFG() : options.cfg,
			sampler: pickSampler(options.randomSampler),
		};

		toast.info(
			(!keepPrompt ? 'Made new prompt. ' : '') + 'Regenerating image...'
		);
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
			const thoughts = await genIsImgReqThoughts(
				inputMsg,
				lastMsg || null,
				chatSummary
			);
			prompt = await genImgPrompt(inputMsg.content, lastMsg?.content, thoughts);
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
				deleteMessages={(ids) => {
					setMessages(messages.filter((msg) => !ids.includes(msg.id)));
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
				defExpandThoughts={false}
				customBtns={{
					'Regen Image': (id) => regenerateImage(id, 20, false, true),
					// Variation: should be near the same image
					Variation: (id) =>
						regenerateImage(id, 20, false, true, GET_RANDOM_CFG()),
					// Better: same image but more steps
					Better: (id) => regenerateImage(id, 30, true),
				}}
			/>
			{chatSummary && (
				<div className="last-prompt flex">
					{chatSummary && (
						<p>
							Summary: <span>{chatSummary}</span>
						</p>
					)}
				</div>
			)}
		</div>
	);
}

export default InnerMonologueChat;
