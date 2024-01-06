import { useState, useEffect } from 'react';
import { AIType, ModelInfo, ServerStatus } from '@/lib/types/new-api';

interface JSONObject {
	[key: string]: JSONValue;
}
type JSONArray = JSONValue[];
type JSONValue = string | number | boolean | null | JSONObject | JSONArray;

interface InitWSOptions {
	type: AIType;
	setStatus: (status: ServerStatus) => void;
	setModelInfo: (modelInfo: ModelInfo | null) => void;
	setModels: (models: string[]) => void;
	wsSend: (message: JSONValue) => void;
}

function initWS({
	type,
	setStatus,
	setModelInfo,
	setModels,
	wsSend,
}: InitWSOptions) {
	const ws = new WebSocket(`ws://localhost:5000/${type}/v1/ws`);
	ws.onopen = () => {
		setStatus(ServerStatus.ON_NO_MODEL);
		try {
			wsSend({ type: 'list_models' });
			wsSend({ type: 'get_model' });
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	};
	ws.onmessage = (event) => {
		// console.log('Message received:', event);
		const message = JSON.parse(event.data);
		const data = JSON.parse(message.data);
		switch (message.type) {
			case 'get_model':
			case 'load_model':
				setModelInfo({
					model: data.model,
					loader_name: data.loader_name,
				});
				setStatus(ServerStatus.ON_MODEL_LOADED);
				break;
			case 'model_unload':
				setModelInfo(null);
				setStatus(ServerStatus.ON_NO_MODEL);
				break;
			case 'list_models':
				data.models.sort((a: string, b: string) =>
					a.toLowerCase().localeCompare(b.toLowerCase())
				);
				setModels(data.models);
				break;
			default:
				console.error('Unknown message type:', message);
				break;
		}
	};
	ws.onclose = () => {
		setStatus(ServerStatus.OFF);
	};
	return ws;
}

export function useServerStatus(type: AIType) {
	let ws: WebSocket | null = null;
	const wsSend = (message: JSONValue) => {
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		if (typeof message !== 'string') message = JSON.stringify(message);
		try {
			ws.send(message);
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	};

	const [status, setStatus] = useState<ServerStatus>(ServerStatus.OFF);
	const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
	const [models, setModels] = useState<string[]>([]);

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
					ws = initWS({ type, setStatus, setModelInfo, setModels, wsSend });
				} catch (error) {
					console.error('Failed to start WS:', error);
					setStatus(ServerStatus.OFF);
					setTimeout(
						startWS,
						lastTimeout ? Math.max(60, lastTimeout * 1.25) : 1000
					);
				}
			}, 250);
		};
		const refreshModel = async () => {
			wsSend({ type: 'get_model' });
		};
		const refreshModels = async () => {
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
