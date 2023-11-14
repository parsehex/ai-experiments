export interface TextChunk {
	id: string;
	title: string;
	content: string;
	metadata?: {
		summary?: string;
	};
}
