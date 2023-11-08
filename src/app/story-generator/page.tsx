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

// resize to fit its content
function autoResize(
	event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
) {
	const element = event.target;
	const isTextarea = element.tagName.toLowerCase() === 'textarea';

	if (isTextarea) {
		element.style.height = 'inherit';
		const computed = window.getComputedStyle(element);
		// Calculate the height
		const height =
			parseInt(computed.getPropertyValue('border-top-width'), 10) +
			parseInt(computed.getPropertyValue('padding-top'), 10) +
			element.scrollHeight +
			parseInt(computed.getPropertyValue('padding-bottom'), 10) +
			parseInt(computed.getPropertyValue('border-bottom-width'), 10);
		element.style.height = `${height}px`;

		// render text in hidden clone, styled so the text doesnt wrap and get width
		const clone = document.createElement('div');
		clone.style.whiteSpace = 'pre';
		clone.style.position = 'absolute';
		clone.style.top = '0';
		clone.style.left = '0';
		clone.style.visibility = 'hidden';
		clone.style.font = computed.getPropertyValue('font');
		clone.textContent = element.value;
		document.body.appendChild(clone);
		const textWidth = clone.offsetWidth;
		// is computed width less than the text width? if so, resize
		if (textWidth < element.offsetWidth) {
			element.style.width = `${textWidth}px`;
		}
	} else {
		const span = document.createElement('span');
		document.body.appendChild(span);

		span.style.font = window.getComputedStyle(element).font;
		span.style.visibility = 'hidden';
		span.style.whiteSpace = 'pre';
		span.textContent = element.value.replace(/ /g, '\u00a0'); // Replace spaces with non-breaking spaces to measure correctly

		element.style.width = `${span.offsetWidth}px`;
		document.body.removeChild(span);
	}
}

const StoryGenerator = () => {
	const { defCharacters, defPlot } = MainStarter();
	const [characters, setCharacters] = useState<Character[]>(defCharacters);
	const [plot, setPlot] = useState<Plot>(defPlot);
	const [actions, setActions] = useState<Action[]>([]);
	const [storyStarter, setStoryStarter] = useState<string>('');
	const [canGenerate, setCanGenerate] = useState(false);

	useEffect(() => {
		document.querySelectorAll('.resize').forEach((element) => {
			autoResize({ target: element } as any);
		});
	}, []);

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
			setCharacters(chars);
		}
		// setCharacters(chars);
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

	const renderCharacterFields = (character: Character) => (
		<div key={character.id} className="character flex border-b-2 mb-2">
			<input
				className="resize input h-9"
				placeholder="Name"
				value={character.name}
				onChange={(e) => {
					handleCharacterChange(character.id, 'name', e.target.value);
					autoResize(e);
				}}
			/>
			<textarea
				className="resize input"
				placeholder="Description"
				value={character.description}
				onChange={(e) =>
					handleCharacterChange(character.id, 'description', e.target.value)
				}
			/>
			<textarea
				className="resize input"
				placeholder="Current State"
				value={character.state}
				onChange={(e) =>
					handleCharacterChange(character.id, 'state', e.target.value)
				}
			/>
			<textarea
				className="resize input"
				placeholder="Short Term Objective"
				value={character.objectives.shortTerm}
				onChange={(e) =>
					handleCharacterChange(character.id, 'shortTerm', e.target.value)
				}
			/>
			<textarea
				className="resize input"
				placeholder="Long Term Objective"
				value={character.objectives.longTerm}
				onChange={(e) =>
					handleCharacterChange(character.id, 'longTerm', e.target.value)
				}
			/>
			<button onClick={() => handleRemoveCharacter(character.id)}>
				Remove Character
			</button>
			{/* TODO: a button that shows if there are character fields missing, to fill missing values
			probably need to generate each value or define a grammar function */}
		</div>
	);

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
					className="input"
					value={plot.tone}
					onChange={handlePlotChange('tone')}
				/>
				<button onClick={() => handleGenerateTone()}>Generate Tone</button>
				<br />
				<label htmlFor="storyDescription">Story Description:</label>
				<textarea
					id="storyDescription"
					className="input"
					value={plot.storyDescription}
					onChange={handlePlotChange('storyDescription')}
				/>
				<button onClick={() => generateStoryDescription()}>
					Generate Description
				</button>
				<br />
				<label htmlFor="location">Location:</label>
				<input
					id="location"
					className="input"
					value={plot.location}
					onChange={handlePlotChange('location')}
				/>
				<label htmlFor="timePeriod">Time Period:</label>
				<input
					id="timePeriod"
					className="input"
					value={plot.timePeriod}
					onChange={handlePlotChange('timePeriod')}
				/>
				<button onClick={() => handleGenerateSetting()}>
					Generate Setting
				</button>
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
					className="input"
					placeholder="How should the story start?"
					value={storyStarter}
					onChange={(e) => setStoryStarter(e.target.value)}
				/>
				<button onClick={() => generateStoryStarter()}>Generate</button>
			</div>
			{StoryBox}
		</>
	);
};

export default withPage({ title })(StoryGenerator);
