import { useState, useEffect } from 'react';
import { ModelInfo, ServerStatus } from '@/lib/types/ooba';
import { listModels, getCurrentModel } from '@/lib/ooba-api';

export function useOobaServerStatus() {
	const [status, setStatus] = useState<ServerStatus>(ServerStatus.OFF);
	const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

	useEffect(() => {
		const checkStatus = async () => {
			try {
				const currentModelName = await getCurrentModel();
				if (currentModelName === 'None' || !currentModelName) {
					setStatus(ServerStatus.ON_NO_MODEL);
				} else {
					setModelInfo({
						model_name: currentModelName,
						lora_names: [],
						'shared.settings': {}, // Default to empty, update as needed
						'shared.args': {}, // Default to empty, update as needed
					});
					setStatus(ServerStatus.ON_MODEL_LOADED);
				}
			} catch (error) {
				console.error('Failed to fetch model info:', error);
				setStatus(ServerStatus.OFF);
			}
		};

		checkStatus();
		const intervalId = setInterval(checkStatus, 10000); // Check every 10 seconds

		return () => clearInterval(intervalId);
	}, []);

	return { status, modelInfo };
}