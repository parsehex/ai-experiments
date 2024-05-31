import { HTMLAttributes } from 'react';

export interface AIModelStatusProps extends HTMLAttributes<HTMLDivElement> {
	type: 'llm' | 'img' | 'tts' | 'stt';
	inline?: boolean;
}

export interface CollapsibleProps extends HTMLAttributes<HTMLDivElement> {
	title: string;
	titleSize?: 'sm' | 'md' | 'lg';
	titleAlign?: 'left' | 'center' | 'right';
	children: React.ReactNode;
	defaultCollapsed?: boolean;
	inline?: boolean;
}

export interface HoverMenuFormFieldOption {
	value: string;
	label: string;
}
export interface HoverMenuFormField {
	type: 'text' | 'number' | 'select';
	label: string;
	name: string;
	title?: string;
	options?: HoverMenuFormFieldOption[]; // Updated for select type fields
	placeholder?: string; // For text type fields
	defaultValue?: any; // For number and select type fields
}
export interface HoverMenuButtonProps {
	fields: HoverMenuFormField[];
	onSubmit: (values: { [key: string]: any }) => void;
	label: string;
}
