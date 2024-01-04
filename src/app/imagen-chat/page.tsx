'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ChatBox } from '@/components/ChatBox';
import { Message } from '@/lib/types/llm';
import { txt2img } from '@/lib/imagen';
import { txt2imgResponseInfo } from '@/lib/imagen/types';
import {
	addMsg,
	getMsgBefore,
	getMsgIndexBefore,
	makeMsg,
	makeThoughtMsg,
} from '@/lib/utils/messages';
import * as gen from './generate';

// NOTE: If we set message content to a promise the chatbox will show a spinner while waiting for the promise to resolve
// (despite TS errors -- it's implemented but not typed)

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
		guidance_scale: cfg,
		seed,
		batch_size: 1,
		n_iter: 1,
		num_inference_steps: steps,
		width: 512,
		height: 768,
	});
	const info: txt2imgResponseInfo = JSON.parse(res.info);
	const image = res.images[0];
	return { image, info };
};

// const aiThoughtMessage = (
// 	thoughts: string | Promise<string>,
// 	label = 'Thoughts',
// 	className = ''
// ): Message => {
// 	let msg: Message = {
// 		id: uuidv4(),
// 		role: 'ASSISTANT',
// 		// @ts-ignore
// 		content: thoughts,
// 		type: 'thought',
// 		thoughtLabel: label,
// 	};
// 	if (className) msg.thoughtClass = className;
// 	return msg;
// };

interface Options {
	wide: boolean;
	expandImages: boolean;
	cfg: number;
	steps: number;
	randomCfg: boolean;
	randomSampler: boolean;
	showThoughts: boolean;
}
const DefaultOptions: Options = {
	wide: false,
	expandImages: true,
	cfg: 4.5,
	steps: 20,
	randomCfg: false,
	randomSampler: true,
	showThoughts: false,
};
type StepsPreset = 'Low' | 'Medium' | 'High' | 'Custom';
function InnerMonologueChat() {
	const defMsg = makeMsg(
		'message',
		'ASSISTANT',
		'Hi, what do you want to talk about?'
	);
	const [messages, setMessages] = useState<Message[]>([defMsg]);
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
	};

	// user sends a message
	const handleSend = async (userInput: string) => {
		if (!userInput) {
			toast.error('Please enter a message');
			return;
		}
		const userMsg = makeMsg('message', 'user', userInput);
		let newMessages = addMsg(userMsg, messages, setMessages);

		let image: string | undefined;
		let imagePrompt = '';
		let seed = -1;

		const intentArea = await gen.pickIntentArea(newMessages, {
			summary: chatSummary,
		});
		// intent doesnt have thought content
		const intentMsg = makeThoughtMsg('', 'Intent: ' + intentArea, 'intent');
		newMessages = addMsg(intentMsg, newMessages, setMessages);

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
			const promptThoughts = gen.imgPromptThoughts(
				userMsg,
				lastMsg,
				chatSummary
			);
			const promptMsg = makeThoughtMsg(
				// @ts-ignore
				promptThoughts,
				'Image Prompt Thoughts',
				'image-prompt-thoughts'
			);
			newMessages = addMsg(promptMsg, newMessages, setMessages);
			const detectedDesc = gen.imgPromptFromInput(userMsg, newMessages, {
				summary: chatSummary,
			});
			const dT = makeThoughtMsg(
				// @ts-ignore
				detectedDesc,
				'Detected Description',
				'detected-desc'
			);
			newMessages = addMsg(dT, newMessages, setMessages);
			const prompt = await gen.imgPrompt(
				await detectedDesc,
				await promptThoughts
			);
			imagePrompt = prompt;
			setLastPrompt(prompt);
			// await addLorasToPrompt(prompt);
			const imgPromptMsg = makeThoughtMsg(
				prompt,
				'Image Prompt',
				'image-prompt'
			);
			newMessages = addMsg(imgPromptMsg, newMessages, setMessages);
			const start = Date.now();
			const res = await txt2img({
				prompt,
				negative_prompt: 'easynegative',
				sampler_name: pickSampler(options.randomSampler),
				guidance_scale: options.randomCfg ? GET_RANDOM_CFG() : options.cfg,
				batch_size: 1,
				n_iter: 1,
				num_inference_steps: options.steps,
				width: 512,
				height: 768,
			});
			const end = Date.now();
			toast.success(`Generated image ${(end - start) / 1000}s`);
			infoparams = JSON.parse(res.info);
			setLastInfo(infoparams);
			image = res.images[0];
			toast.success('Image generated');
		}

		const response = gen.continueChat(userInput, newMessages, {
			madeImage: !!image,
			imagePrompt: imagePrompt,
		});
		const o: any = {};
		if (image) {
			o.images = [{ url: image, prompt: lastInfo.prompt, seed }];
		}
		// @ts-ignore
		const aiMessage = makeMsg('message', 'ASSISTANT', response, o);
		newMessages = addMsg(aiMessage, newMessages, setMessages);
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
		const intentMsg = makeThoughtMsg('', 'Intent: ' + intentArea, 'intent');
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
			const promptMsg = makeThoughtMsg(
				promptThoughts,
				'Image Prompt Thoughts',
				'image-prompt-thoughts'
			);
			newMessages = updateThoughts(promptMsg, msgIndex, promptMsg);
			prompt = await gen.imgPrompt(inputMsg.content, lastMsg?.content);
			setLastPrompt(prompt);
			const imgPromptMsg = makeThoughtMsg(
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
			const promptMsg = makeThoughtMsg(
				promptThoughts,
				'Image Prompt Thoughts',
				'image-prompt-thoughts'
			);
			newMessages = updateThoughts(promptMsg, messages.indexOf(msg), promptMsg);
			prompt = await gen.imgPrompt(inputMsg.content, promptThoughts);
			setLastPrompt(prompt);
			const imgPromptMsg = makeThoughtMsg(
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
				<label>
					Show Thoughts
					<input
						type="checkbox"
						checked={options.showThoughts}
						onChange={(e) =>
							setOptions({ ...options, showThoughts: e.target.checked })
						}
					/>
				</label>
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
				messages={
					options.showThoughts
						? messages
						: messages.filter((m) => m.type !== 'thought')
				}
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
