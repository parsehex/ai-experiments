import { v4 } from 'uuid';
import { ImgType, Message } from '../types/llm';

export function getMsgBefore(
	messages: Message[],
	test: (msg: Message) => boolean,
	before?: number | Message
): Message | undefined {
	if (before === undefined) before = messages[messages.length - 1];
	if (typeof before !== 'number') {
		before = messages.indexOf(before);
	}
	for (let i = before; i >= 0; i--) {
		if (test(messages[i])) return messages[i];
	}
	return undefined;
}
export function getMsgIndexBefore(
	messages: Message[],
	test: (msg: Message) => boolean,
	before?: number | Message
): number {
	if (before === undefined) before = messages[messages.length - 1];
	if (typeof before !== 'number') {
		before = messages.indexOf(before);
	}
	for (let i = before; i >= 0; i--) {
		if (test(messages[i])) return i;
	}
	return -1;
}

interface MakeMsgOptions {
	images?: ImgType[];
	thoughtLabel?: string;
	thoughtClass?: string;
}
export function makeMsg(
	type: 'message' | 'thought',
	role: string,
	content: string,
	opt: MakeMsgOptions = {}
): Message {
	const { images = [], thoughtLabel, thoughtClass } = opt;
	const msg: Message = {
		id: v4(),
		role,
		content,
		type,
		images,
	};
	if (thoughtLabel) msg.thoughtLabel = thoughtLabel;
	if (thoughtClass) msg.thoughtClass = thoughtClass;
	return msg;
}

/** Convenience function to add a message to the messages array and update the state. */
export function addMsg(
	msg: Message,
	messages: Message[],
	setMessages: (msgs: Message[]) => void
): Message[] {
	const newMessages = [...messages, msg];
	setMessages(newMessages);
	return newMessages;
}

export function makeThoughtMsg(
	thoughts: string,
	label = 'Thoughts',
	className = ''
): Message {
	let o: Partial<Message> = {
		thoughtLabel: label,
	};
	if (className) o.thoughtClass = className;
	return makeMsg('thought', 'ASSISTANT', thoughts, o);
}
