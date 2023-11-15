import React, { useState, useEffect } from 'react';
import { useOobaServerStatus } from '@/hooks/useOobaServerStatus';
import { ServerStatus } from '@/lib/types/ooba.new';
import { loadModel, listModels } from '@/lib/llm/ooba-api.new';

const defaultModels = ['gpt-3.5-turbo', 'text-embedding-ada-002'];

const LLMModelStatus: React.FC = () => {
	const { status, modelInfo } = useOobaServerStatus();
	const [isExpanded, setIsExpanded] = useState(false);
	const [models, setModels] = useState([] as string[]);
	const [selectedModel, setSelectedModel] = useState('');

	useEffect(() => {
		if (
			status === ServerStatus.ON_NO_MODEL ||
			status === ServerStatus.ON_MODEL_LOADED
		) {
			listModels().then((models) => {
				if (!models || !models?.data?.length) return;
				const modelList = models.data
					.filter((model) => !defaultModels.includes(model.id))
					.map((model) => model.id);
				if (modelList.length === 0) return;
				setModels(modelList);
				// is first model "None"?
				if (models.data[0].id === 'None') {
					// no model loaded
					setSelectedModel('');
				}
			});
		}
	}, [status]);

	const getStatusColor = () => {
		switch (status) {
			case ServerStatus.OFF:
				return 'bg-red-500';
			case ServerStatus.ON_NO_MODEL:
				return 'bg-orange-500';
			case ServerStatus.ON_MODEL_LOADED:
				return 'bg-green-500';
			case ServerStatus.LOADING_MODEL:
				return 'bg-yellow-500';
			default:
				return 'bg-gray-500';
		}
	};

	const handleToggleExpand = () => {
		if (status === ServerStatus.OFF) return;
		setIsExpanded(!isExpanded);
	};

	const handleModelSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const selected = event.target.value;
		setSelectedModel(selected);
	};

	const handleLoadModel = (model = selectedModel) => {
		if (model) loadModel(model);
	};

	return (
		<div className="flex flex-col">
			<div
				className={`h-3 w-full rounded-full ${getStatusColor()} cursor-pointer`}
				onClick={handleToggleExpand}
			/>
			{isExpanded && (
				<div className="mt-2 p-2 border rounded shadow-lg bg-white">
					{status === ServerStatus.ON_NO_MODEL && (
						<>
							<div>Load a model:</div>
							<select onChange={handleModelSelect} value={selectedModel}>
								<option value="">Select a Model</option>
								{models.map((model) => (
									<option key={model} value={model}>
										{model}
									</option>
								))}
							</select>
							{!!selectedModel && (
								<button
									className="basic"
									onClick={() => handleLoadModel(selectedModel)}
								>
									Load
								</button>
							)}
						</>
					)}
					{status === ServerStatus.ON_MODEL_LOADED && (
						<>
							<div>Model: {modelInfo?.model_name}</div>
							{/* Placeholder for Unload/Reload controls */}
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default LLMModelStatus;
