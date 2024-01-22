import { GenerateOptions } from '../llm';

type BtnCallback = (id: string) => void;
export interface CustomBtns {
	[key: string]: BtnCallback;
}

export type PhaseType = {
	name: string;
	template: string;
	variables: (
		input: string,
		previousResults: Record<string, string>
	) => Record<string, string>;
	extraParams?: GenerateOptions;
	processOutput?: (output: string) => string;
	shouldStop?: (output: string) => boolean;
};

export interface WhisperResultChunk {
	/**
	 * Timestamp of the start of the chunk.
	 *
	 * e.g. `"00:00:00.000"`
	 */
	start: number;
	/**
	 * Timestamp of the end of the chunk.
	 *
	 * e.g. `"00:00:00.000"`
	 */
	end: number;
	/** The speech during that chunk. */
	speech: string;
	/**
	 * The speaker of that chunk,
	 * or empty string if diarization is disabled.
	 */
	speaker: string;
}
