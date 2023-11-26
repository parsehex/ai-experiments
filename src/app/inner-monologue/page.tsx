'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types';
import { txt2img } from '@/lib/imagen';
import { txt2imgResponseInfo } from '@/lib/imagen/types';
import * as gen from './generate';
import { getMsgBefore, getMsgIndexBefore } from '@/lib/utils';

const RANCFG_MIN = 1;
const RANCFG_MAX = 6;

const StepsPresets = {
	Low: 16,
	Medium: 32,
	High: 64,
};

const GET_RANDOM_CFG = () =>
	Math.random() * (RANCFG_MAX - RANCFG_MIN) + RANCFG_MIN;

const pickSampler = (ran = true) => {
	const choices = ['Euler a', 'LMS Karras', 'UniPC'];
	if (!ran) return choices[0];
	return choices[Math.floor(Math.random() * choices.length)];
};

const generateImg = async (
	prompt: string,
	seed: number,
	cfg: number,
	sampler: string,
	steps = DefaultOptions.steps
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

const aiThoughtMessage = (
	thoughts: string | Promise<string>,
	label = 'Thoughts',
	className = ''
): Message => {
	let msg: Message = {
		id: uuidv4(),
		role: 'ASSISTANT',
		// @ts-ignore
		content: thoughts,
		type: 'thought',
		thoughtLabel: label,
	};
	if (className) msg.thoughtClass = className;
	return msg;
};

interface Options {
	wide: boolean;
	expandImages: boolean;
	cfg: number;
	steps: number;
	randomCfg: boolean;
	randomSampler: boolean;
}
const DefaultOptions: Options = {
	wide: false,
	expandImages: true,
	cfg: 4.5,
	steps: 20,
	randomCfg: false,
	randomSampler: true,
};
type StepsPreset = 'Low' | 'Medium' | 'High' | 'Custom';
function InnerMonologueChat() {
	const [messages, setMessages] = useState<Message[]>([
		{
			role: 'ASSISTANT',
			content: 'Hi, what do you want to talk about?',
			id: uuidv4(),
		},
	]);
	const [chatSummary, setChatSummary] = useState('');
	const [options, setOptions] = useState(DefaultOptions);
	const [lastPrompt, setLastPrompt] = useState('');
	const [lastInfo, setLastInfo] = useState({} as txt2imgResponseInfo);
	const [stepsPreset, setStepsPreset] = useState('Low' as StepsPreset);

	useEffect(() => {
		if (stepsPreset === 'Low') setOptions({ ...options, steps: 16 });
		else if (stepsPreset === 'Medium') setOptions({ ...options, steps: 32 });
		else if (stepsPreset === 'High') setOptions({ ...options, steps: 64 });
	}, [stepsPreset]);

	const updateSummary = async (msgs = messages) => {
		const summary = await gen.summarizeChat(msgs, chatSummary);
		setChatSummary(summary);
		// console.log('summary', summary);
	};

	// user sends a message
	const handleSend = async (userInput: string) => {
		if (!userInput) {
			toast.error('Please enter a message');
			return;
		}

		let newMessages = [
			...messages,
			{ role: 'USER', content: userInput, id: uuidv4() },
		];
		const userMsg = newMessages[newMessages.length - 1];
		setMessages(newMessages);

		let image: string | undefined;
		let imagePrompt = '';
		let seed = -1;

		const intentArea = await gen.pickIntentArea(newMessages, {
			summary: chatSummary,
		});
		const intentMsg = aiThoughtMessage('', 'Intent: ' + intentArea, 'intent');
		newMessages = [...newMessages, intentMsg];
		setMessages(newMessages);

		const lastMsg = getMsgBefore(
			newMessages,
			(m) => m.type !== 'thought' && m.role.toLowerCase() === 'assistant',
			userMsg
		);
		const isImgReq = intentArea.includes('IMAGE');
		let infoparams: txt2imgResponseInfo;
		if (isImgReq) {
			// const specificIntent = await gen.pickImageIntent(newMessages, {
			// 	summary: chatSummary,
			// });
			// console.log('specificIntent', specificIntent);
			const promptThoughts = await gen.imgPromptThoughts(
				userMsg,
				lastMsg,
				chatSummary
			);
			const promptMsg = aiThoughtMessage(
				promptThoughts,
				'Image Prompt Thoughts',
				'image-prompt-thoughts'
			);
			newMessages = [...newMessages, promptMsg];
			setMessages(newMessages);
			const detectedDesc = await gen.imgPromptFromInput(userMsg, newMessages, {
				summary: chatSummary,
			});
			const dT = aiThoughtMessage(
				detectedDesc,
				'Detected Description',
				'detected-desc'
			);
			newMessages = [...newMessages, dT];
			setMessages(newMessages);
			const prompt = await gen.imgPrompt(detectedDesc, promptThoughts);
			imagePrompt = prompt;
			setLastPrompt(prompt);
			// await addLorasToPrompt(prompt);
			const imgPromptMsg = aiThoughtMessage(
				prompt,
				'Image Prompt',
				'image-prompt'
			);
			newMessages = [...newMessages, imgPromptMsg];
			setMessages(newMessages);
			const start = Date.now();
			const res = await txt2img({
				prompt,
				negative_prompt: 'easynegative',
				sampler_name: pickSampler(options.randomSampler),
				cfg_scale: options.randomCfg ? GET_RANDOM_CFG() : options.cfg,
				batch_size: 1,
				n_iter: 1,
				steps: options.steps,
				width: 512,
				height: 768,
			});
			const end = Date.now();
			toast.success(`Generated image ${(end - start) / 1000}s`);
			infoparams = JSON.parse(res.info);
			setLastInfo(infoparams);
			image = res.images[0];
		}

		const response = gen.continueChat(userInput, newMessages, {
			madeImage: !!image,
			imagePrompt: imagePrompt,
		});
		toast.success('Response generated');
		const aiMessage: Message = {
			role: 'ASSISTANT',
			// @ts-ignore
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
		setChatSummary('');
		setLastPrompt('');
		toast.info('Console cleared', { autoClose: 1000 });
	};

	/** Finds nearest thought of the same class above the given message index and update it. **Calls `setMessages`** */
	const updateThoughts = (msg: Message, msgIndex: number, thought: Message) => {
		const newMessages = messages.slice();
		const iirIndex = getMsgIndexBefore(
			newMessages,
			(m) => m.thoughtClass === thought.thoughtClass,
			msgIndex
		);
		if (iirIndex === -1)
			toast.error(`No ${thought.thoughtClass} thought found`);
		newMessages[iirIndex] = msg;
		setMessages([...newMessages]);
		return newMessages;
	};

	const regenerateMessage = async (
		id: string,
		keepPrompt = false,
		onlyImage = true
	) => {
		const msg = messages.find((msg) => msg.id === id);
		const msgIndex = messages.findIndex((msg) => msg.id === id);
		if (!msg) return;
		const inputMsg = getMsgBefore(
			messages,
			(m) => m.role.toLowerCase() === 'user',
			msg
		);
		const lastMsg = getMsgBefore(
			messages,
			(m) => m.type !== 'thought' && m.role.toLowerCase() === 'assistant',
			inputMsg
		);
		console.log('lastMsg', lastMsg);
		if (!inputMsg) {
			toast.error('No input message found');
			return;
		}

		const intentArea = await gen.pickIntentArea(messages, {
			summary: chatSummary,
		});
		const intentMsg = aiThoughtMessage('', 'Intent: ' + intentArea, 'intent');
		let newMessages = updateThoughts(intentMsg, msgIndex, intentMsg);
		const isImgReq = intentArea.includes('IMAGE');
		if (!isImgReq) return;
		let prompt = '';
		let seed = -1;
		if (keepPrompt && typeof msg.images !== 'string') {
			prompt = lastPrompt;
			// @ts-ignore
			seed = msg.images[0].seed || lastInfo.seed;
		} else {
			const promptThoughts = await gen.imgPromptThoughts(
				inputMsg,
				lastMsg,
				chatSummary
			);
			const promptMsg = aiThoughtMessage(
				promptThoughts,
				'Image Prompt Thoughts',
				'image-prompt-thoughts'
			);
			newMessages = updateThoughts(promptMsg, msgIndex, promptMsg);
			prompt = await gen.imgPrompt(inputMsg.content, lastMsg?.content);
			setLastPrompt(prompt);
			const imgPromptMsg = aiThoughtMessage(
				prompt,
				'Image Prompt',
				'image-prompt'
			);
			newMessages = updateThoughts(imgPromptMsg, msgIndex, imgPromptMsg);
		}

		const opt = {
			cfg: options.randomCfg ? GET_RANDOM_CFG() : options.cfg,
			sampler: pickSampler(options.randomSampler),
		};

		toast.info(
			(!keepPrompt ? 'Made new prompt. ' : '') + 'Regenerating image...'
		);
		const start = Date.now();
		const { image, info } = await generateImg(
			prompt,
			seed,
			opt.cfg,
			opt.sampler,
			options.steps
		);
		const end = (Date.now() - start) / 1000;
		toast.success(`Generated image ${end}s`);
		setLastInfo(info);
		newMessages = messages.map((msg) => {
			if (msg.id === id) {
				msg.images = [{ url: image, prompt, seed: info.seed }];
			}
			return msg;
		});
		setMessages([...newMessages]);
	};

	const regenerateImage = async ({
		msgId,
		verbatim = false,
		keepPrompt = true,
		cfg,
		sampler,
		steps,
	}: {
		msgId: string;
		verbatim?: boolean;
		keepPrompt?: boolean;
		cfg?: number;
		sampler?: string;
		steps?: number;
	}) => {
		const msg = messages.find((msg) => msg.id === msgId);
		if (!msg) return;
		const inputMsg = getMsgBefore(
			messages,
			(m) => m.role.toLowerCase() === 'user',
			msg
		);
		const lastMsg = getMsgBefore(
			messages,
			(m) => m.type !== 'thought' && m.role.toLowerCase() === 'assistant',
			inputMsg
		);
		if (!inputMsg) return;
		let newMessages = messages.slice();
		let prompt = '';
		let seed = -1;
		toast.info('Regenerating image...');
		const img = msg.images && msg.images[0];
		let hasOldPrompt = false;
		let oldPrompt = '';
		if (img && typeof img !== 'string' && img.prompt) {
			hasOldPrompt = !!img.prompt;
			oldPrompt = img.prompt;
		} else {
			// TODO probably not really a good idea
			hasOldPrompt = !!lastPrompt;
			oldPrompt = lastPrompt;
		}
		if ((keepPrompt || verbatim) && hasOldPrompt) {
			prompt = oldPrompt;
			if (verbatim && typeof img !== 'string')
				// @ts-ignore
				seed = img?.seed || lastInfo.seed || -1;
		} else {
			const promptThoughts = await gen.imgPromptThoughts(
				inputMsg,
				lastMsg,
				chatSummary
			);
			const promptMsg = aiThoughtMessage(
				promptThoughts,
				'Image Prompt Thoughts',
				'image-prompt-thoughts'
			);
			newMessages = updateThoughts(promptMsg, messages.indexOf(msg), promptMsg);
			prompt = await gen.imgPrompt(inputMsg.content, promptThoughts);
			setLastPrompt(prompt);
			const imgPromptMsg = aiThoughtMessage(
				prompt,
				'Image Prompt',
				'image-prompt'
			);
			newMessages = updateThoughts(
				imgPromptMsg,
				messages.indexOf(msg),
				imgPromptMsg
			);
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
		const start = Date.now();
		const { image, info } = await generateImg(
			prompt,
			seed,
			opt.cfg,
			opt.sampler,
			steps || options.steps
		);
		setLastInfo(info);
		const end = (Date.now() - start) / 1000;
		toast.success(`Generated image ${end}s`);
		newMessages = messages.map((msg) => {
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
						className={`input ml-2 ${options.randomCfg ? 'disabled' : ''}`}
						step={0.25}
						min={1}
						value={options.cfg}
						onChange={(e) => setOptions({ ...options, cfg: +e.target.value })}
						style={{ width: '4rem' }}
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
					Steps
					<select
						value={stepsPreset}
						title={
							stepsPreset === 'Custom'
								? 'Custom Steps'
								: StepsPresets[stepsPreset] + ' steps'
						}
						onChange={(e) => {
							setStepsPreset(e.target.value as StepsPreset);
							if (e.target.value === 'Custom') return;
							// @ts-ignore
							const steps = StepsPresets[e.target.value as StepsPreset];
							setOptions({ ...options, steps });
						}}
					>
						<option value="Low">Low</option>
						<option value="Medium">Medium</option>
						<option value="High">High</option>
						<option value="Custom">Custom</option>
					</select>
					{stepsPreset === 'Custom' && (
						<input
							type="number"
							className="input ml-2"
							step={1}
							min={1}
							value={options.steps}
							onChange={(e) =>
								setOptions({ ...options, steps: +e.target.value })
							}
							style={{ width: '4rem' }}
						/>
					)}
				</label>
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
					// generate new prompt and everything else
					'New Image': (id) =>
						regenerateImage({ msgId: id, keepPrompt: false }),
					// use same prompt and seed
					'Regen Image': (id) => regenerateImage({ msgId: id, verbatim: true }),
					// Variation: should be near the same image
					Variation: (id) =>
						regenerateImage({
							msgId: id,
							keepPrompt: true,
							cfg: GET_RANDOM_CFG(),
						}),
					// Better: same image but more steps
					Better: (id) =>
						regenerateImage({
							msgId: id,
							verbatim: true,
							steps: options.steps * 1.25,
						}),
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
