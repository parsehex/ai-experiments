export interface TextChunk {
	id: string;
	title: string;
	content: string | TextChunk[];
	originalContent?: string;
	metadata?: {
		summary?: string;
		tokenCount?: number;
	};
}
