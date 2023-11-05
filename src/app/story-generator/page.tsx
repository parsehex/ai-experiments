'use client';
import React, { useEffect, useState } from 'react';
import { v4 } from 'uuid';
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
	genPickAction,
	genSetting,
	genStarter,
	genStoryDescription,
	genTone,
	genWriteAction,
} from './prompt-parts';
import { MainStarter } from './starters';
import { makeCharacter } from './story';
import { Character, Plot, Action } from './types';
import CollapsibleSection from '@/components/CollapsibleSection';

const title = 'Story Generator';

const StoryGenerator = () => {
	const { defCharacters, defPlot } = MainStarter();
	const [characters, setCharacters] = useState<Character[]>(defCharacters);
	const [plot, setPlot] = useState<Plot>(defPlot);
	const [actions, setActions] = useState<Action[]>([]);
	const [storyStarter, setStoryStarter] = useState<string>('');
	const [canGenerate, setCanGenerate] = useState(false);

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

	const renderCharacterFields = (character: Character) => (
		<div key={character.id} className="character flex border-b-2 mb-2">
			<input
				placeholder="Name"
				value={character.name}
				onChange={(e) =>
					handleCharacterChange(character.id, 'name', e.target.value)
				}
			/>
			<textarea
				placeholder="Description"
				value={character.description}
				onChange={(e) =>
					handleCharacterChange(character.id, 'description', e.target.value)
				}
			/>
			<textarea
				placeholder="Current State"
				value={character.state}
				onChange={(e) =>
					handleCharacterChange(character.id, 'state', e.target.value)
				}
			/>
			<textarea
				placeholder="Short Term Objective"
				value={character.objectives.shortTerm}
				onChange={(e) =>
					handleCharacterChange(character.id, 'shortTerm', e.target.value)
				}
			/>
			<textarea
				placeholder="Long Term Objective"
				value={character.objectives.longTerm}
				onChange={(e) =>
					handleCharacterChange(character.id, 'longTerm', e.target.value)
				}
			/>
			<button onClick={() => handleRemoveCharacter(character.id)}>
				Remove Character
			</button>
		</div>
	);

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
		// console.log('Generating', num, 'characters');
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
			const existingChar = chars.find(
				(c) => c.name.toLowerCase().trim() === char.name.toLowerCase().trim()
			);
			if (!char.id) char.id = v4();
			if (existingChar) {
				// console.log('Updating existing character:', existingChar);
				chars.splice(chars.indexOf(existingChar), 1, char);
			} else {
				chars.push(char);
			}
		}
		setCharacters(chars);
		return chars;
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
		const result = JSON.parse(
			await generate(parts, {
				temp: 0.5,
				cfg: 1.5,
				grammar: Sentences(1),
				max: 100,
				log: { response: 'Tone:' },
			})
		);
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
	const startStory = async (
		c: Character[] = characters,
		p: Plot = plot,
		a: Action[] = actions
	) => {
		if (!actions.length) {
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
		const actionThoughts: Action = JSON.parse(actionStr);
		actionThoughts.id = v4();

		const action = genWriteAction(c, p, a, actionThoughts.str);
		const result = await generate(action, {
			cfg: 1.25,
			grammar: ActionObject(),
			max: 256,
			log: { response: 'Action:', prompt: 'Action Prompt:' },
		});
		const newAction: Action = JSON.parse(result);
		newAction.id = v4();
		setActions([...a, newAction]);
	};

	const handleAutoFill = async () => {
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

	const CharactersBox = (
		<CollapsibleSection title="Characters">
			{characters.map(renderCharacterFields)}
			<span className="flex">
				<button onClick={handleAddCharacter}>Add Character</button>
				<HoverMenuButton
					label="Generate Characters"
					fields={addCharacterOptions}
					onSubmit={(v) => handleGenerateCharacters(v.numChars)}
				/>
			</span>
		</CollapsibleSection>
	);

	const StoryInfoBox = (
		<CollapsibleSection title="Story Info">
			<div>
				<label htmlFor="tone">Tone:</label>
				<input
					id="tone"
					value={plot.tone}
					onChange={handlePlotChange('tone')}
				/>
				{/* @ts-ignore */}
				<button onClick={handleGenerateTone}>Generate Tone</button>
				<br />
				<label htmlFor="storyDescription">Story Description:</label>
				<textarea
					id="storyDescription"
					value={plot.storyDescription}
					onChange={handlePlotChange('storyDescription')}
				/>
				{/* @ts-ignore */}
				<button onClick={generateStoryDescription}>Generate Description</button>
				<br />
				<label htmlFor="location">Location:</label>
				<input
					id="location"
					value={plot.location}
					onChange={handlePlotChange('location')}
				/>
				<label htmlFor="timePeriod">Time Period:</label>
				<input
					id="timePeriod"
					value={plot.timePeriod}
					onChange={handlePlotChange('timePeriod')}
				/>
				{/* @ts-ignore */}
				<button onClick={handleGenerateSetting}>Generate Setting</button>
			</div>
		</CollapsibleSection>
	);

	const StoryBox = (
		<div className="story">
			<span className="story-header flex">
				<h2>Story</h2>
				{canGenerate && (
					<button onClick={() => startStory()}>
						{actions.length ? 'Continue' : 'Start Story'}
					</button>
				)}
				{!!actions.length && (
					<button onClick={handleClearActions}>Reset Story</button>
				)}
			</span>
			<div className="story-actions">
				{actions.map((action) => (
					<div key={action.id}>{action.str}</div>
				))}
			</div>
		</div>
	);

	return (
		<>
			<button onClick={handleAutoFill}>Auto-Fill</button>
			{StoryInfoBox}
			{CharactersBox}
			<div>
				<h2>Story Starter</h2>
				<textarea
					id="storyStarter"
					placeholder="How should the story start?"
					value={storyStarter}
					onChange={(e) => setStoryStarter(e.target.value)}
				/>
				{/* @ts-ignore */}
				<button onClick={generateStoryStarter}>Generate</button>
			</div>
			{StoryBox}
		</>
	);
};

export default withPage({ title })(StoryGenerator);
