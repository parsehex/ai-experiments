import React, { useState, useEffect, HTMLAttributes } from 'react';
import { useServerStatus } from '@/hooks/useServerStatus';
import {
	LoadModelResponse,
	LoaderName,
	ServerStatus,
} from '@/lib/types/new-api';
import * as llm from '@/lib/llm/new-api';
import * as img from '@/lib/imagen';
import * as tts from '@/lib/tts';

export interface AIModelStatusProps extends HTMLAttributes<HTMLDivElement> {
	type: 'llm' | 'img' | 'tts' | 'stt';
	inline?: boolean;
}

const AIModelStatus: React.FC<AIModelStatusProps> = ({ type, inline }) => {
	let name = type.toUpperCase();
	if (type === 'img') name = 'Img';
	const { status, setStatus, modelInfo, setModelInfo, models } =
		useServerStatus(type);
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

	const loadModel = async (model: string) => {
		switch (type) {
			case 'llm':
				return await llm.loadModel(model);
			case 'img':
				return await img.loadModel(model);
			case 'tts':
				return await tts.loadModel(model);
			case 'stt':
				console.log('STT not implemented');
		}
	};
	const unloadModel = async () => {
		switch (type) {
			case 'llm':
				return await llm.unloadModel();
			case 'img':
				return await img.unloadModel();
			case 'tts':
				return await tts.unloadModel();
			case 'stt':
				console.log('STT not implemented');
		}
	};

	const handleLoadModel = async (model = selectedModel) => {
		let res: LoadModelResponse | undefined;
		if (model) res = await loadModel(model);
		if (res) {
			setModelInfo({
				model: res.model,
				loader_name: res.loader_name as LoaderName,
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

	// either normal flex or inline flex
	const flexClass = inline ? 'inline-flex' : 'flex';
	return (
		<div
			className={`${flexClass} flex-col`}
			style={{
				minWidth: inline ? '50px' : 'auto',
			}}
		>
			<div
				className={`h-3 w-full rounded-full ${getStatusColor()} cursor-pointer`}
				onClick={handleToggleExpand}
				title={`${name} Status`}
			/>
			{isExpanded && (
				<div className="mb-3 p-2 border rounded shadow-lg bg-white dark:bg-gray-800">
					{(status === ServerStatus.ON_NO_MODEL ||
						status === ServerStatus.ON_MODEL_LOADED) && (
						<>
							{modelInfo && (
								<div className="mb-2 flex">
									<div className="font-bold">Current {name} Model:</div>
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

export default AIModelStatus;
