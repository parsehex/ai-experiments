import { useState, useEffect } from 'react';
import { ModelInfo, ServerStatus } from '@/lib/types/new-api';
import { getModel } from '@/lib/llm/new-api';

export function useServerStatus() {
	const [status, setStatus] = useState<ServerStatus>(ServerStatus.OFF);
	const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

	useEffect(() => {
		const checkStatus = async () => {
			try {
				const currentModel = await getModel();
				if (currentModel.model_name === 'None' || !currentModel) {
					setStatus(ServerStatus.ON_NO_MODEL);
				} else {
					setModelInfo({
						model_name: currentModel.model_name,
						loader_name: currentModel.loader_name,
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

	return { status, setStatus, modelInfo, setModelInfo };
}
