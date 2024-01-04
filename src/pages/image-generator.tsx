import '@/styles/image-generator.scss';
import React, { useState, useEffect } from 'react';
import { txt2img, getSamplers } from '@/lib/imagen';
import { txt2imgResponseInfo } from '@/lib/imagen/types';
import { IoRefreshOutline, IoShuffleOutline } from 'react-icons/io5';
import TextInput from '@/components/TextInput';
import ImgCarousel from '@/components/ImgCarousel';
import ImgModelStatus from '@/components/ImgModelStatus';

// TODO
//   show something when getting samplers fails, meaning the server is not online
//   support setting params via url (can link to customize in chatbox)

const DefaultParams = {
	width: 512,
	height: 768,
};
const SizePresets = [
	{ label: '512x768', width: 512, height: 768 },
	{ label: '1024x1024', width: 1024, height: 1024 },
];

const ImageGenerator = () => {
	const [prompt, setPrompt] = useState('beautiful');
	const [negativePrompt, setNegativePrompt] = useState('easynegative');
	const [seed, setSeed] = useState(-1);
	const [samplers, setSamplers] = useState([] as string[]);
	const [selectedSampler, setSelectedSampler] = useState('');
	const [cfgScale, setCfgScale] = useState(4.5);
	const [batchSize, setBatchSize] = useState(1);
	const [nIter, setNIter] = useState(1);
	const [steps, setSteps] = useState(10);
	const [generatedImages, setGeneratedImages] = useState([] as string[]);
	const [lastGenParams, setLastGenParams] = useState({} as txt2imgResponseInfo);
	const [genTime, setGenTime] = useState(0);
	const [sdOnline, setSdOnline] = useState(false);
	const [width, setWidth] = useState(DefaultParams.width);
	const [height, setHeight] = useState(DefaultParams.height);
	const [selectedSizePreset, setSelectedSizePreset] = useState(SizePresets[0]);

	useEffect(() => {
		setWidth(selectedSizePreset.width);
		setHeight(selectedSizePreset.height);
	}, [selectedSizePreset]);

	useEffect(() => {
		getSamplers()
			.then((samplers) => {
				setSdOnline(true);
				// const samplerNames = samplers.map((sampler) => sampler.name);
				// setSamplers(samplerNames);
				// const i = samplerNames.indexOf('Euler a');
				// setSelectedSampler(samplers[i || 0].name);
			})
			.catch(() => {
				setSdOnline(false);
			});
	}, []);

	const handleSubmit = async () => {
		if (!prompt) return;
		const startTime = Date.now();
		const response = await txt2img({
			prompt,
			negative_prompt: negativePrompt,
			seed,
			sampler_name: selectedSampler,
			guidance_scale: cfgScale,
			batch_size: batchSize,
			n_iter: nIter,
			num_inference_steps: steps,
			width,
			height,
		});
		setGeneratedImages(response.images);
		console.log(response);
		setGenTime(Date.now() - startTime);
		// const params: txt2imgResponseInfo = JSON.parse(response.info);
		// setLastGenParams(params);
	};

	const GenOptions = () => {
		return (
			<div className="gen-options">
				<ImgModelStatus />
				<div>
					<TextInput
						label="Prompt"
						id="imagen-prompt"
						value={[prompt, setPrompt]}
					/>
					<TextInput
						label="Negative Prompt"
						id="imagen-negprompt"
						value={[negativePrompt, setNegativePrompt]}
					/>
					<label>
						Size
						<select
							value={selectedSizePreset.label}
							onChange={(e) => {
								const preset = SizePresets.find(
									(p) => p.label === e.target.value
								);
								if (preset) setSelectedSizePreset(preset);
							}}
						>
							{SizePresets.map((preset) => (
								<option key={preset.label} value={preset.label}>
									{preset.label}
								</option>
							))}
						</select>
					</label>
				</div>
				<div>
					<label>
						Steps
						<input
							type="number"
							className="input"
							min={1}
							max={200}
							value={steps}
							style={{ width: '4rem' }}
							onChange={(e) => setSteps(+e.target.value)}
						/>
					</label>
					<label>
						Seed
						<input
							type="number"
							className="input"
							min={-1}
							value={seed}
							onChange={(e) => setSeed(parseInt(e.target.value))}
						/>
					</label>
					<button
						type="button"
						className="basic p-1"
						onClick={() => setSeed(-1)}
					>
						<IoShuffleOutline />
					</button>
					<button
						type="button"
						className="basic p-1"
						onClick={() => {
							const lastSeed = lastGenParams?.seed;
							if (lastSeed) setSeed(lastSeed);
						}}
					>
						<IoRefreshOutline />
					</button>
				</div>
				<div>
					<label>
						CFG
						<input
							type="number"
							className="input"
							min={1}
							max={20}
							step={0.25}
							value={cfgScale}
							style={{ width: '6rem' }}
							onChange={(e) => setCfgScale(+e.target.value)}
						/>
					</label>
					<label>
						Sampler
						<select
							value={selectedSampler}
							onChange={(e) => setSelectedSampler(e.target.value)}
						>
							{samplers.map((sampler) => (
								<option key={sampler} value={sampler}>
									{sampler}
								</option>
							))}
						</select>
					</label>
				</div>
				<button type="button" className="basic" onClick={handleSubmit}>
					Generate
				</button>
				{genTime > 0 && (
					<span className="params">(last: {genTime / 1000}s)</span>
				)}
			</div>
		);
	};

	return (
		<div className="flex">
			{sdOnline ? (
				<>
					{GenOptions()}

					{!!generatedImages.length && (
						<div className="gen-image flex flex-col">
							{lastGenParams.infotexts?.length && (
								<span className="params">{lastGenParams.infotexts[0]}</span>
							)}
							<ImgCarousel images={generatedImages} defaultExpanded={true} />
						</div>
					)}
				</>
			) : (
				<div className="gen-image flex flex-col">
					<h2>Stable Diffusion is offline</h2>
				</div>
			)}
		</div>
	);
};

export default ImageGenerator;
