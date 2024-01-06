import React, { useState, useEffect } from 'react';
import { useServerStatus } from '@/hooks/useLLMServerStatus';
import { LoadModelResponse, ServerStatus } from '@/lib/types/new-api';
import { loadModel, unloadModel } from '@/lib/llm/new-api';

const LLMModelStatus: React.FC = () => {
	const { status, setStatus, modelInfo, setModelInfo, models } =
		useServerStatus();
	const [isExpanded, setIsExpanded] = useState(false);
	const [selectedModel, setSelectedModel] = useState('');

	// (some) model names have prefixes like "openai:" (local has no prefix)
	const [sources, setSources] = useState({ local: [] } as Record<
		string,
		string[]
	>);
	const [selectedSource, setSelectedSource] = useState('');

	useEffect(() => {
		if (models.length > 0) {
			const s: Record<string, string[]> = { local: [] };
			for (const model of models) {
				if (!model.includes(':')) {
					s.local.push(model);
					continue;
				}
				const source = model.split(':')[0];
				if (!s[source]) s[source] = [];
				s[source].push(model);
			}
			setSources(s);
		}
	}, [models]);

	// when we get modelinfo for first time,
	//   update the selected source and model
	useEffect(() => {
		if (!modelInfo || selectedModel) return;
		if (!modelInfo.model.includes(':')) {
			setSelectedSource('local');
			setSelectedModel(modelInfo.model);
			return;
		}
		const source = modelInfo.model.split(':')[0];
		setSelectedSource(source);
		setSelectedModel(modelInfo.model.split(':')[1]);
	}, [modelInfo]);

	useEffect(() => {
		setSelectedSource('local');
	}, []);

	const handleSourceSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const selected = event.target.value;
		setSelectedSource(selected);
	};

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

	const LoadModelControls = () => {
		return (
			<div>
				Source:
				<select
					className="mx-1"
					onChange={handleSourceSelect}
					value={selectedSource}
				>
					{Object.keys(sources).map((source) => (
						<option key={source} value={source}>
							{source}
						</option>
					))}
				</select>
				Load Model:
				<select
					className="mx-1"
					onChange={handleModelSelect}
					value={selectedModel}
				>
					{sources[selectedSource].map((model) => (
						<option key={model} value={model}>
							{model}
						</option>
					))}
				</select>
				{!!selectedModel && selectedModel !== modelInfo?.model && (
					<button
						className="basic"
						onClick={() => handleLoadModel(selectedModel)}
					>
						Load
					</button>
				)}
			</div>
		);
	};

	return (
		<div className="flex flex-col">
			<div
				className={`h-3 w-full rounded-full ${getStatusColor()} cursor-pointer`}
				onClick={handleToggleExpand}
			/>
			{isExpanded && (
				<div className="mb-3 p-2 border rounded shadow-lg bg-white dark:bg-gray-800">
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
							{models.length > 0 && LoadModelControls()}
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default LLMModelStatus;
