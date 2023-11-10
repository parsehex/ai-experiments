'use client';
import React, { useEffect, useState } from 'react';
import { v4 } from 'uuid';
import Collapsible from '@/components/Collapsible';
import HoverMenuButton from '@/components/HoverMenuButton';
import { withPage } from '@/components/Page';
import { generate } from '@/lib/llm';
import {
	Lines,
	CharacterObject,
	SettingObject,
	ActionObject,
	Sentences,
} from '@/lib/llm/grammar';
import { addCharacterOptions } from './hover-menus';
import {
	genCharacters,
	genDialogueAction,
	genFillCharacterDetails,
	genNarrativeAction,
	genPickAction,
	genSetting,
	genStarter,
	genStoryDescription,
	genTone,
} from './prompt-parts';
import { makeCharacter } from './story';
import { Character, Plot, Action } from './types';
import { PromptPart } from '@/lib/llm/types';
import LLMModelStatus from '@/components/LLMModelStatus';
import StarterPresets from './starters';
import CopyableTextInput from '@/components/CopyableTextInput';

const title = 'Story Generator';

const StoryGenerator = () => {
	const starter = StarterPresets[1];
	const defCharacters = starter.defaultCharacters;
	const defPlot = starter.defaultPlot;
	const [characters, setCharacters] = useState<Character[]>(defCharacters);
	const [plot, setPlot] = useState<Plot>(defPlot);
	const [actions, setActions] = useState<Action[]>([]);
	const [storyStarter, setStoryStarter] = useState<string>('');
	const [canGenerate, setCanGenerate] = useState(false);
	const [selectedPreset, setSelectedPreset] = useState<string>(starter.name);
	const [userRequest, setUserRequest] = useState('');

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

	const handlePlotChange =
		(field: keyof Plot) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setPlot({ ...plot, [field]: e.target.value });
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
		const parts = genStoryDescription(c, p);
		const generatedDescription = await generate(parts, {
			temp: 0.25,
			cfg: 1.5,
			grammar: Lines({
				n: 1,
				sentences: { min: 2, max: 5, startWithWord: true },
			}),
			// log: { response: 'Description:' },
		});

		setPlot((prevPlot) => ({
			...prevPlot,
			storyDescription: generatedDescription.trim(),
		}));
		return generatedDescription;
	};
	const handleGenerateCharacters = async (
		num: number,
		c: Character[] = characters,
		p: Plot = plot
	) => {
		const chars: Character[] = [...c];
		if (!num) num = Math.floor(Math.random() * 5) + 1;

		for (let i = 0; i < num; i++) {
			const parts = genCharacters([...chars], p);
			const result = await generate(parts, {
				temp: 0.75,
				cfg: 1.15,
				grammar: CharacterObject(),
				max: 512,
				// log: { response: 'Character:' },
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

		const parts = genFillCharacterDetails(character, characters, plot);
		const result = await generate(parts, {
			temp: 0.75,
			cfg: 1.5,
			grammar: CharacterObject(),
			max: 512,
			// log: { response: 'Character:' },
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
		const parts = genSetting(c, p);
		const result = JSON.parse(
			await generate(parts, {
				cfg: 1.25,
				grammar: SettingObject(),
				max: 256,
				log: { response: 'Setting:' },
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
		const parts = genTone(c, p);
		const result = await generate(parts, {
			temp: 0.25,
			cfg: 1.15,
			grammar: Sentences(1),
			max: 100,
			log: { response: 'Tone:' },
		});
		handlePlotChange('tone')({ target: { value: result } } as any);
		return result;
	};
	const generateStoryStarter = async (
		c: Character[] = characters,
		p: Plot = plot
	) => {
		const parts = genStarter(c, p);
		const result = await generate(parts, {
			cfg: 2,
			temp: 0.5,
			grammar: Lines({ n: 1, sentences: { min: 1, max: 2 } }),
			max: 256,
			log: { response: 'Starter:', prompt: 'Starter Prompt:' },
		});
		setStoryStarter(result.trim());
		const action: Action = {
			id: v4(),
			type: 'Narrative',
			str: result.trim(),
		};
		setActions([action]);
		return action;
	};
	const startOrContinueStory = async (
		c: Character[] = characters,
		p: Plot = plot,
		a: Action[] = actions
	) => {
		if (!actions.length) {
			// no actions, make first
			let starter = storyStarter;
			if (!starter) {
				const starterAction = await generateStoryStarter(c, p);
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
		const actionParts = genPickAction(c, p, a);
		const actionStr = await generate(actionParts, {
			cfg: 1.1,
			grammar: ActionObject(),
			max: 256,
			log: { response: 'Thought:', prompt: 'Thought Prompt:' },
		});
		const actionThoughts: Omit<Action, 'aiThoughts'> = JSON.parse(actionStr);
		actionThoughts.id = v4();

		let actionParts2: PromptPart[] = [];
		if (actionThoughts.type === 'Narrative') {
			actionParts2 = genNarrativeAction(c, p, a, actionThoughts.str);
		} else if (actionThoughts.type === 'Dialogue') {
			actionParts2 = genDialogueAction(
				c,
				p,
				a,
				actionThoughts.str,
				actionThoughts.characterName || ''
			);
		}
		const result = await generate(actionParts2, {
			temp: 0.5,
			cfg: 1.25,
			// grammar: Lines({ n: 1, sentences: { min: 1, max: 5 } }),
			grammar: Sentences(1, false, 1, 3),
			max: 512,
			log: { response: 'Action:', prompt: 'Action Prompt:' },
		});
		const newAction: Action = {
			id: v4(),
			type: actionThoughts.type,
			str: result.trim(),
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
		const action = await generateStoryStarter(c, p);
		a = [action];
		tempState.actions = a;
		await startStory(c, p, a);
	};

	const handleClearActions = () => {
		setActions([]);
	};

	const handleDeleteAction = (actionId: string) => {
		setActions(actions.filter((action) => action.id !== actionId));
	};

	const renderCharacterFields = (character: Character) => (
		<div key={character.id} className="character flex border-b-2 mb-2">
			<CopyableTextInput
				className="h-9"
				minWidth="8rem"
				placeholder="Name"
				value={[
					character.name,
					handleCharacterChange.bind(null, character.id, 'name'),
				]}
			/>
			<CopyableTextInput
				placeholder="Description"
				value={[
					character.description,
					handleCharacterChange.bind(null, character.id, 'description'),
				]}
				isTextarea
			/>
			<CopyableTextInput
				placeholder="Current State"
				value={[
					character.state,
					handleCharacterChange.bind(null, character.id, 'state'),
				]}
				isTextarea
			/>
			<CopyableTextInput
				placeholder="Short Term Objective"
				value={[
					character.objectives.shortTerm,
					handleCharacterChange.bind(null, character.id, 'shortTerm'),
				]}
				isTextarea
			/>
			<CopyableTextInput
				placeholder="Long Term Objective"
				value={[
					character.objectives.longTerm,
					handleCharacterChange.bind(null, character.id, 'longTerm'),
				]}
				isTextarea
			/>
			<button
				className="basic"
				onClick={() => handleRemoveCharacter(character.id)}
			>
				Remove Character
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
					onSubmit={(v) => handleGenerateCharacters(v.numChars)}
				/>
			</span>
		</Collapsible>
	);

	const StoryInfoBox = (
		<Collapsible title="Story Info" titleSize="md">
			<div>
				<label htmlFor="tone">Tone:</label>
				<CopyableTextInput
					id="tone"
					value={[plot.tone, handlePlotChange.bind(null, 'tone')]}
				/>
				<button className="basic" onClick={() => handleGenerateTone()}>
					Generate Tone
				</button>
				<br />
				<label htmlFor="storyDescription">Story Description:</label>
				<CopyableTextInput
					id="storyDescription"
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
				<label htmlFor="location">Location:</label>
				<CopyableTextInput
					id="location"
					className="input"
					value={[plot.location, handlePlotChange.bind(null, 'location')]}
				/>
				<label htmlFor="timePeriod">Time Period:</label>
				<CopyableTextInput
					id="timePeriod"
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
		<Collapsible title="Story Starter" titleSize="md">
			<CopyableTextInput
				id="storyStarter"
				className="input"
				placeholder="How should the story start?"
				value={[storyStarter, setStoryStarter]}
				isTextarea
			/>
			<button className="basic" onClick={() => generateStoryStarter()}>
				Generate
			</button>
		</Collapsible>
	);

	const StoryBox = (
		<div className="story w-2/3 mx-auto">
			<span className="story-header flex">
				<h2>Story</h2>
				{canGenerate && (
					<button className="basic" onClick={() => startStory()}>
						{actions.length ? 'Continue' : 'Start Story'}
					</button>
				)}
				{!!actions.length && (
					<button className="basic" onClick={handleClearActions}>
						Reset Story
					</button>
				)}
			</span>
			<div className="story-actions">
				{actions.map((action) => (
					<div
						key={action.id}
						className="action-item hover:bg-gray-100 relative"
					>
						{action.aiThoughts && (
							<Collapsible title="Thoughts" titleSize="sm" className="ml-1">
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
							className="delete-action-button hidden absolute top-0 right-0"
							onClick={() => handleDeleteAction(action.id)}
						>
							Delete
						</button>
					</div>
				))}
			</div>
		</div>
	);

	return (
		<>
			<LLMModelStatus />
			<div>
				<select
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
			{StoryStarter}
			{StoryBox}
		</>
	);
};

export default withPage({ title })(StoryGenerator);
