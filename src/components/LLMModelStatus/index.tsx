import React, { useState, useEffect } from 'react';
import { useServerStatus } from '@/hooks/useServerStatus';
import { LoadModelResponse, ServerStatus } from '@/lib/types/new-api';
import { loadModel, unloadModel } from '@/lib/llm/new-api';

const LLMModelStatus: React.FC = () => {
	const { status, setStatus, modelInfo, setModelInfo, models } =
		useServerStatus();
	const [isExpanded, setIsExpanded] = useState(false);
	const [selectedModel, setSelectedModel] = useState('');

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
			// TODO new status: haven't checked yet (gray)
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

	const handleLoadModel = async (model = selectedModel) => {
		let res: LoadModelResponse | undefined;
		if (model) res = await loadModel(model);
		if (res) {
			setModelInfo({
				model: res.model,
				loader_name: res.loader_name || '',
			});
			setSelectedModel('');
			setStatus(ServerStatus.ON_MODEL_LOADED);
		}
	};

	const handleUnloadModel = async () => {
		await unloadModel();
		setModelInfo(null);
		setStatus(ServerStatus.ON_NO_MODEL);
	};

	return (
		<div className="flex flex-col">
			<div
				className={`h-3 w-full rounded-full ${getStatusColor()} cursor-pointer`}
				onClick={handleToggleExpand}
			/>
			{isExpanded && (
				<div className="mb-3 p-2 border rounded shadow-lg bg-white">
					{(status === ServerStatus.ON_NO_MODEL ||
						status === ServerStatus.ON_MODEL_LOADED) && (
						<>
							{modelInfo && (
								<div className="mb-2 flex">
									<div className="font-bold">Current Model:</div>
									<div>
										{modelInfo.model} (<i>{modelInfo.loader_name}</i> loader)
									</div>
									<button className="ml-2 basic" onClick={handleUnloadModel}>
										Unload
									</button>
								</div>
							)}
							<div>
								Load Model:
								<select
									className="mx-1"
									onChange={handleModelSelect}
									value={selectedModel}
								>
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
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default LLMModelStatus;
