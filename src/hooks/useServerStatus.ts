import { useState, useEffect } from 'react';
import { AIType, ModelInfo, ServerStatus } from '@/lib/types/new-api';

interface JSONObject {
	[key: string]: JSONValue;
}
type JSONArray = JSONValue[];
type JSONValue = string | number | boolean | null | JSONObject | JSONArray;

type TsetStatus = (status: ServerStatus) => void;
type TsetModelInfo = (modelInfo: ModelInfo | null) => void;
type TsetModels = (models: string[]) => void;
interface InitWSOptions {
	type: AIType;
	setStatus: TsetStatus;
	setModelInfo: TsetModelInfo;
	setModels: TsetModels;
	wsSend: (message: JSONValue) => void;
}

function handleMessage(
	setModelInfo: TsetModelInfo,
	setModels: TsetModels,
	setStatus: TsetStatus,
	e: MessageEvent
) {
	const message = JSON.parse(e.data);
	const { type: messageType, data } = message;
	const { model, loader_name } = JSON.parse(data) ?? {};

	switch (messageType) {
		case 'get_model':
		case 'load_model':
			setModelInfo({ model, loader_name });
			setStatus(ServerStatus.ON_MODEL_LOADED);
			break;
		case 'model_unload':
			setModelInfo(null);
			setStatus(ServerStatus.ON_NO_MODEL);
			break;
		case 'list_models':
			const models =
				data?.models?.sort((a: string, b: string) =>
					a.toLowerCase().localeCompare(b.toLowerCase())
				) ?? [];
			setModels(models);
			break;
		default:
			console.error('Unknown message type:', message);
			break;
	}
}

let ws: WebSocket | null = null;
let didConnect = false;
let isReconnecting = false;

function initWS({
	type,
	setStatus,
	setModelInfo,
	setModels,
	wsSend,
}: InitWSOptions) {
	const reconnect = () => {
		setTimeout(() => {
			initWS({ type, setStatus, setModelInfo, setModels, wsSend });
		}, 5000);
	};

	if (isReconnecting) return reconnect();
	isReconnecting = true;

	try {
		ws = new WebSocket(`ws://localhost:5000/${type}/v1/ws`);
	} catch (error) {
		setStatus(ServerStatus.OFF);
		isReconnecting = false;
		if (!isReconnecting) reconnect();
		return;
	}

	ws.onopen = () => {
		didConnect = true;
		isReconnecting = false;
		setStatus(ServerStatus.ON_NO_MODEL);
		try {
			wsSend({ type: 'list_models' });
			wsSend({ type: 'get_model' });
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	};

	ws.onmessage = handleMessage.bind(null, setModelInfo, setModels, setStatus);

	ws.onerror = (error) => {
		if (!isReconnecting) console.error('WebSocket error:', error);
		setStatus(ServerStatus.OFF);
		if (!isReconnecting) reconnect();
	};

	ws.onclose = (event) => {
		isReconnecting = false;
		didConnect = false;
		setStatus(ServerStatus.OFF);
		if (!isReconnecting || !didConnect) reconnect();
	};

	return ws;
}

export function useServerStatus(type: AIType) {
	const [status, setStatus] = useState<ServerStatus>(ServerStatus.OFF);
	const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
	const [models, setModels] = useState<string[]>([]);

	const wsSend = (message: JSONValue) => {
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		if (typeof message !== 'string') message = JSON.stringify(message);
		try {
			ws.send(message);
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	};

	useEffect(() => {
		if (
			status === ServerStatus.ON_NO_MODEL ||
			status === ServerStatus.ON_MODEL_LOADED
		) {
			wsSend({ type: 'list_models' });
		}
	}, [status]);

	useEffect(() => {
		const startWS = (lastTimeout?: number) => {
			setTimeout(() => {
				try {
					initWS({ type, setStatus, setModelInfo, setModels, wsSend });
				} catch (error) {
					console.error('Failed to start WS:', error);
					setStatus(ServerStatus.OFF);
					setTimeout(startWS, lastTimeout || 1000);
				}
			}, 250);
		};

		const refreshModel = () => {
			wsSend({ type: 'get_model' });
		};

		const refreshModels = () => {
			wsSend({ type: 'list_models' });
		};

		startWS();

		const intervalIds = [
			setInterval(refreshModel, 7_500),
			setInterval(refreshModels, 30_000),
		];

		return () => {
			if (ws) ws.close();
			for (const intervalId of intervalIds) clearInterval(intervalId);
		};
	}, []);

	return { status, setStatus, modelInfo, setModelInfo, models };
}
