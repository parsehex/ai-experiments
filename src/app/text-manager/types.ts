export interface TextChunk {
	id: string;
	title: string;
	content: string | TextChunk[];
	originalContent?: string;
	detectedType?: string;
	metadata?: {
		summary?: string;
		tokenCount?: number;
	};
}
