'use client';
import React, { useEffect, useState } from 'react';
import { IoTrash } from 'react-icons/io5';
import { v4 } from 'uuid';
import Collapsible from '@/components/Collapsible';
import TextInput from '@/components/TextInput';
import HoverMenuButton from '@/components/HoverMenuButton';
import AIModelStatus from '@/components/AIModelStatus';
import { generate, complete } from '@/lib/llm';
import { PromptPartResponse } from '@/lib/types/llm';
import { addCharacterOptions } from './hover-menus';
import * as parts from './prompts';
import { makeCharacter } from './story';
import { Character, Plot, Action } from './types';
import StarterPresets from './starters';
import { makePrompt } from '@/lib/llm/prompts';

const StoryGenerator = () => {
	const starter = StarterPresets[StarterPresets.length - 1];
	const defCharacters = starter.defaultCharacters;
	const defPlot = starter.defaultPlot;
	const [characters, setCharacters] = useState<Character[]>(defCharacters);
	const [plot, setPlot] = useState<Plot>(defPlot);
	const [actions, setActions] = useState<Action[]>([]);
	const [storyIntro, setStoryIntro] = useState<string>(defPlot.storyIntro);
	const [canGenerate, setCanGenerate] = useState(false);
	const [selectedPreset, setSelectedPreset] = useState<string>(starter.name);
	const [userInfluence, setUserInfluence] = useState('');
	const divRef = React.useRef<HTMLDivElement>(null);
	const setFunc = (v: string): void =>
		setTmpManualLine({
			...tmpManualLine,
			value: {
				v,
				set: setFunc,
			},
		});
	const [tmpManualLine, setTmpManualLine] = useState({
		value: {
			v: '',
			set: setFunc,
		},
		characterName: '',
		type: 'Narrative' as 'Narrative' | 'Dialogue',
	});

	useEffect(() => {
		if (divRef.current) {
			divRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [actions]);

	// watch the state and set canGenerate to true if required fields are filled
	useEffect(() => {
		if (
			(characters.length || (plot.location && plot.timePeriod)) &&
			plot.storyDescription
		) {
			setCanGenerate(true);
		} else {
			setCanGenerate(false);
		}
	}, [characters, plot]);

	const applyPreset = (presetName: string) => {
		const preset = StarterPresets.find((p) => p.name === presetName);
		if (preset) {
			setCharacters(preset.defaultCharacters);
			setPlot(preset.defaultPlot);
		}
		setSelectedPreset(presetName);
	};
	type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
	const handlePlotChange = (field: keyof Plot, value: string) => {
		setPlot({ ...plot, [field]: value });
	};

	const handleAddCharacter = () => {
		const newCharacter = makeCharacter();
		setCharacters([...characters, newCharacter]);
	};

	const handleCharacterChange = (
		id: string,
		field: keyof Character | keyof Character['objectives'],
		value: string
	) => {
		setCharacters(
			characters.map((char) => {
				if (char.id !== id) return char;
				if (field in char.objectives) {
					return {
						...char,
						objectives: { ...char.objectives, [field]: value },
					};
				}
				return { ...char, [field]: value };
			})
		);
	};
	const handleRemoveCharacter = (characterId: string) => {
		setCharacters(characters.filter((char) => char.id !== characterId));
	};

	const generateStoryDescription = async (
		c: Character[] = characters,
		p: Plot = plot
	) => {
		const generatedDescription = await complete(
			parts.genStoryDescription(c, p),
			{ max_tokens: 128 }
		);

		setPlot((prevPlot) => ({
			...prevPlot,
			storyDescription: generatedDescription.trim(),
		}));
		return generatedDescription;
	};
	const handleGenerateCharacters = async (
		num: number,
		relevance = 'off',
		c: Character[] = characters,
		p: Plot = plot
	) => {
		const chars: Character[] = [...c];
		if (!num) num = Math.floor(Math.random() * 5) + 1;

		for (let i = 0; i < num; i++) {
			const fmt = parts.genCharacters([...chars], p, relevance);
			const result = await complete(fmt, {
				temp: 0.75,
				max_tokens: 512,
			});
			const char = JSON.parse(result) as Character;
			const completeChar = makeCharacter({}, char);

			const existingChar = chars.find(
				(c) =>
					c.name.toLowerCase().trim() === completeChar.name.toLowerCase().trim()
			);
			if (!completeChar.id) completeChar.id = v4();
			if (existingChar) {
				chars.splice(chars.indexOf(existingChar), 1, completeChar);
			} else {
				chars.push(completeChar);
			}
			setCharacters(chars);
		}
		return chars;
	};
	const fillCharacterDetails = async (character: Character) => {
		if (character.isComplete()) return;

		const fmt = parts.genFillCharacterDetails(character, characters, plot);
		const result = await complete(fmt, {
			temp: 0.75,
			max_tokens: 512,
		});
		const updatedCharacter = JSON.parse(result) as Character;

		// Re-create the Character instance
		const completeCharacter = makeCharacter({}, updatedCharacter);

		setCharacters(
			characters.map((char) =>
				char.id === character.id ? { ...char, ...completeCharacter } : char
			)
		);
	};

	const handleGenerateSetting = async (
		c: Character[] = characters,
		p: Plot = plot
	) => {
		const fmt = parts.genSetting(c, p);
		const result = JSON.parse(
			await complete(fmt, {
				max_tokens: 256,
			})
		);
		const newSetting: Partial<Plot> = {
			location: result.location,
			timePeriod: result.timePeriod,
		};
		setPlot((prevPlot) => ({ ...prevPlot, ...newSetting }));
		return newSetting as Pick<Plot, 'location' | 'timePeriod'>;
	};
	const handleGenerateTone = async (
		c: Character[] = characters,
		p: Plot = plot
	) => {
		const fmt = parts.genTone(c, p);
		const result = await complete(fmt, {
			temp: 0.25,
			max_tokens: 100,
		});
		handlePlotChange('tone', result.trim());
		return result;
	};
	const generateStoryIntro = async (
		c: Character[] = characters,
		p: Plot = plot
	) => {
		const fmt = parts.genStarter(c, p);
		const result = await complete(fmt, {
			temp: 0.25,
			max_tokens: 256,
		});
		setStoryIntro(result.trim());
		const action: Action = {
			id: v4(),
			type: 'Narrative',
			str: result.trim(),
		};
		setActions([action]);
		return action;
	};
	const startOrContinueStory = async (
		userRequest: string | null,
		c: Character[] = characters,
		p: Plot = plot,
		a: Action[] = actions
	) => {
		if (!actions.length) {
			// no actions, make first
			let starter = storyIntro;
			if (!starter) {
				const starterAction = await generateStoryIntro(c, p);
				starter = starterAction.str;
			}
			a = [
				{
					id: v4(),
					type: 'Narrative',
					str: starter,
				},
			];
		}
		let pickActionFmt = parts.genPickAction(c, p, a, userRequest);
		const actionStr = await complete(pickActionFmt, {
			temp: 0.25,
			max_tokens: 384,
		});
		const actionThoughts: Omit<Action, 'aiThoughts'> = JSON.parse(actionStr);
		actionThoughts.id = v4();

		let actionThoughtsFmt: PromptPartResponse;
		if (actionThoughts.type === 'Narrative') {
			actionThoughtsFmt = parts.genNarrativeAction(c, p, a, actionThoughts.str);
		} else {
			actionThoughtsFmt = parts.genDialogueAction(
				c,
				p,
				a,
				actionThoughts.str,
				actionThoughts.characterName || ''
			);
		}
		const result = await complete(actionThoughtsFmt, {
			temp: actionThoughts.type === 'Dialogue' ? 0.25 : 0.01,
			max_tokens: 512,
			stop: ['\n'],
		});
		let newActionStr = result.trim();
		if (actionThoughts.type === 'Dialogue') {
			// detect and try to fix the returned format
			// check if character name is at the start of the string, remove if so
			// also remove surrounding quotes
			const charName = actionThoughts.characterName;
			if (charName && newActionStr.startsWith(charName)) {
				newActionStr = newActionStr.slice(charName.length).trim();
				// is there a colon after the name? remove it
				if (newActionStr.startsWith(':')) {
					newActionStr = newActionStr.slice(1).trim();
				}
			}
			// remove surrounding quotes
			if (newActionStr.startsWith('"') && newActionStr.endsWith('"')) {
				newActionStr = newActionStr.slice(1, -1);
			}
		}
		const newAction: Action = {
			id: v4(),
			type: actionThoughts.type,
			str: newActionStr,
			characterName: actionThoughts.characterName,
			aiThoughts: actionThoughts.str,
		};
		setActions([...a, newAction]);
	};

	const handleAutoFill = async () => {
		// debugger;
		// TODO disable inputs while generating (& eventually provide a way to accept/reject or undo)
		interface TempState {
			characters: Character[];
			plot: Plot;
			actions: Action[];
		}
		const tempState: TempState = {
			characters: [],
			plot: {
				storyDescription: '',
				location: '',
				timePeriod: '',
				tone: '',
				storyIntro: '',
				storySummary: '',
				upcomingEvents: [],
			},
			actions: [],
		};
		let c = characters,
			p = plot,
			a = actions;
		if (c.length < 2) {
			const chars = await handleGenerateCharacters(2);
			tempState.characters = chars;
			c = chars;
		}
		if (!p.location && !p.timePeriod) {
			const newSetting = await handleGenerateSetting(c);
			tempState.plot.location = newSetting.location;
			tempState.plot.timePeriod = newSetting.timePeriod;
			p = { ...p, ...newSetting };
		}
		if (!p.storyDescription) {
			const newStoryDesc = await generateStoryDescription(c);
			tempState.plot.storyDescription = newStoryDesc;
			p = { ...p, storyDescription: newStoryDesc };
		}
		if (!p.tone) {
			const newTone = await handleGenerateTone(c, p);
			tempState.plot.tone = newTone;
			p = { ...p, tone: newTone };
		}
		const action = await generateStoryIntro(c, p);
		a = [action];
		tempState.actions = a;
		await startOrContinueStory(null, c, p, a);
	};

	const handleClearActions = () => {
		setActions([]);
	};

	const handleDeleteAction = (actionId: string) => {
		setActions(actions.filter((action) => action.id !== actionId));
	};

	const renderCharacterFields = (character: Character) => (
		<div
			key={character.id}
			className="character border-b-2 mb-2 flex items-start"
			ref={divRef}
		>
			<TextInput
				// className="h-9"
				minWidth="8rem"
				label="Name"
				placeholder="Name"
				value={[
					character.name,
					handleCharacterChange.bind(null, character.id, 'name'),
				]}
			/>
			<TextInput
				label="Description"
				placeholder="Description"
				value={[
					character.description,
					handleCharacterChange.bind(null, character.id, 'description'),
				]}
				isTextarea
			/>
			<TextInput
				label="State"
				placeholder="Current State"
				value={[
					character.state,
					handleCharacterChange.bind(null, character.id, 'state'),
				]}
				isTextarea
			/>
			<TextInput
				label="Short Term Objective"
				placeholder="Short Term Objective"
				value={[
					character.objectives.shortTerm,
					handleCharacterChange.bind(null, character.id, 'shortTerm'),
				]}
				isTextarea
			/>
			<TextInput
				label="Long Term Objective"
				placeholder="Long Term Objective"
				value={[
					character.objectives.longTerm,
					handleCharacterChange.bind(null, character.id, 'longTerm'),
				]}
				isTextarea
			/>
			<button
				className="delete"
				onClick={() => handleRemoveCharacter(character.id)}
				title="Delete Character"
			>
				<IoTrash />
			</button>
			{!character.isComplete() && (
				<button
					className="basic"
					onClick={() => fillCharacterDetails(character)}
				>
					Fill
				</button>
			)}
		</div>
	);

	const CharactersBox = (
		<Collapsible title="Characters" titleSize="md">
			{characters.map(renderCharacterFields)}
			<span className="flex">
				<button className="basic" onClick={handleAddCharacter}>
					Add Character
				</button>
				<HoverMenuButton
					label="Generate Characters"
					fields={addCharacterOptions}
					onSubmit={(v) => handleGenerateCharacters(v.numChars, v.relevance)}
				/>
			</span>
		</Collapsible>
	);

	const StoryInfoBox = (
		<Collapsible title="Story Info" titleSize="md">
			<div>
				<TextInput
					label="Tone"
					labelOrientation="horizontal"
					value={[plot.tone, handlePlotChange.bind(null, 'tone')]}
				/>
				<button className="basic" onClick={() => handleGenerateTone()}>
					Generate Tone
				</button>
				<br />
				<TextInput
					label="Story Description"
					labelOrientation="horizontal"
					value={[
						plot.storyDescription,
						handlePlotChange.bind(null, 'storyDescription'),
					]}
					isTextarea
				/>
				<button className="basic" onClick={() => generateStoryDescription()}>
					Generate Description
				</button>
				<br />
				<TextInput
					label="Location"
					labelOrientation="horizontal"
					className="input"
					value={[plot.location, handlePlotChange.bind(null, 'location')]}
				/>
				<TextInput
					label="Time Period"
					labelOrientation="horizontal"
					className="input"
					value={[plot.timePeriod, handlePlotChange.bind(null, 'timePeriod')]}
				/>
				<button className="basic" onClick={() => handleGenerateSetting()}>
					Generate Setting
				</button>
			</div>
		</Collapsible>
	);

	const StoryStarter = (
		<Collapsible title="Introduction" titleSize="md" className="ml-3">
			<TextInput
				id="storyIntro"
				className="input"
				placeholder="How should the story start?"
				value={[storyIntro, setStoryIntro]}
				isTextarea
			/>
			<button className="basic" onClick={() => generateStoryIntro()}>
				Generate
			</button>
		</Collapsible>
	);

	const StoryBox = (
		<div className="story w-2/3 mt-3 mx-auto pb-20">
			<h2>Story</h2>
			<span className="story-header flex flex-col justify-center">
				<TextInput
					placeholder="Influence story (optional)"
					value={[userInfluence, setUserInfluence]}
					canCopy={false}
				/>
				{StoryStarter}
				<div>
					{storyIntro && (
						<button
							className="basic"
							onClick={() => startOrContinueStory(userInfluence)}
						>
							{actions.length ? 'Continue' : 'Start Story'}
						</button>
					)}
					{!!actions.length && (
						<button
							className="basic delete"
							onClick={handleClearActions}
							title="Clear Story"
						>
							Reset
						</button>
					)}
				</div>
			</span>
			<div className="story-actions">
				{actions.map((action) => (
					<div
						key={action.id}
						className="action-item hover:bg-gray-100 relative"
					>
						{action.aiThoughts && (
							<Collapsible
								title="Thoughts"
								titleSize="sm"
								className="ml-1"
								defaultCollapsed
							>
								<div className="ai-thoughts ml-3">{action.aiThoughts}</div>
							</Collapsible>
						)}
						{/* if dialogue, show character name */}
						{action.type === 'Dialogue' && (
							<span className="font-bold italic mr-2">
								{action.characterName}
							</span>
						)}
						{action.str}
						<button
							className="delete delete-action-button hidden absolute top-0 right-0"
							onClick={() => handleDeleteAction(action.id)}
							title="Delete Action Line"
						>
							<IoTrash />
						</button>
					</div>
				))}
				<select
					value={tmpManualLine.type}
					onChange={(e) => {
						const o = { ...tmpManualLine, type: e.target.value as any };
						if (o.type === 'Dialogue') {
							o.characterName = characters[0].name;
						}
						setTmpManualLine(o);
					}}
				>
					<option value="Narrative">Narrative</option>
					<option value="Dialogue">Dialogue</option>
				</select>
				{tmpManualLine.type === 'Dialogue' && (
					<select
						value={tmpManualLine.characterName}
						onChange={(e) =>
							setTmpManualLine({
								...tmpManualLine,
								characterName: e.target.value,
							})
						}
					>
						{characters.map((char) => (
							<option key={char.id} value={char.name}>
								{char.name}
							</option>
						))}
					</select>
				)}
				<TextInput
					placeholder="Write next line..."
					value={[tmpManualLine.value.v, setFunc]}
					onKeyDown={(e) => {
						if (e.key !== 'Enter') return;
						const newAction: Action = {
							id: v4(),
							type: tmpManualLine.type,
							str: tmpManualLine.value.v,
							characterName: tmpManualLine.characterName,
						};
						setActions([...actions, newAction]);
						setTmpManualLine({
							...tmpManualLine,
							value: { ...tmpManualLine.value, v: '' },
						});
					}}
					canCopy={false}
				/>
			</div>
		</div>
	);

	return (
		<>
			<AIModelStatus type="llm" />
			<div>
				<label htmlFor="preset">Preset:</label>
				<select
					id="preset"
					className="p-1"
					value={selectedPreset}
					onChange={(e) => applyPreset(e.target.value)}
				>
					{StarterPresets.map((preset) => (
						<option key={preset.name} value={preset.name}>
							{preset.name}
						</option>
					))}
				</select>
				<button className="basic" onClick={handleAutoFill}>
					Auto-Fill
				</button>
			</div>
			{StoryInfoBox}
			{CharactersBox}
			{canGenerate && StoryBox}
		</>
	);
};

export default StoryGenerator;
