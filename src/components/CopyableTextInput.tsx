import React, { useEffect, useState } from 'react';
import { IoClipboardOutline } from 'react-icons/io5';

type CommonInputProps = Omit<
	React.InputHTMLAttributes<HTMLInputElement>,
	'value'
> &
	Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value'>;

interface CopyableTextInputProps extends CommonInputProps {
	value: [string, (value: string) => void];
	isTextarea?: boolean;
	minWidth?: string;
	label?: string;
	labelOrientation?: 'horizontal' | 'vertical';
}

const CopyableTextInput: React.FC<CopyableTextInputProps> = ({
	value: v,
	isTextarea = false,
	minWidth = '15rem',
	label,
	labelOrientation = 'vertical',
	...rest
}) => {
	const [value, updateValue] = v;
	const [copySuccess, setCopySuccess] = useState('');
	const inputRef = React.createRef<HTMLInputElement | HTMLTextAreaElement>();

	useEffect(() => {
		if (inputRef.current) {
			autoResize(inputRef.current);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, inputRef]);

	const autoResize = (element: HTMLInputElement | HTMLTextAreaElement) => {
		if (isTextarea) {
			const textarea = element as HTMLTextAreaElement;
			textarea.style.height = 'inherit';
			const computed = window.getComputedStyle(textarea);
			const height =
				textarea.scrollHeight +
				parseInt(computed.getPropertyValue('border-top-width'), 10) +
				parseInt(computed.getPropertyValue('padding-top'), 10) +
				parseInt(computed.getPropertyValue('padding-bottom'), 10) +
				parseInt(computed.getPropertyValue('border-bottom-width'), 10);
			textarea.style.height = `${height}px`;
		} else {
			const input = element as HTMLInputElement;
			const span = document.createElement('span');
			document.body.appendChild(span);

			span.style.font = window.getComputedStyle(input).font;
			span.style.visibility = 'hidden';
			span.style.whiteSpace = 'pre';
			span.textContent = input.value.replace(/ /g, '\u00a0');

			input.style.width = `${span.offsetWidth}px`;
			document.body.removeChild(span);
		}
	};

	const handleCopyClick = () => {
		navigator.clipboard.writeText(value).then(
			() => setCopySuccess('Copied!'),
			() => setCopySuccess('Failed to copy')
		);
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		updateValue(e.target.value);
		autoResize(e.target);
	};
	const labelClass =
		labelOrientation === 'horizontal'
			? 'inline-block text-sm font-medium text-gray-700 mr-2'
			: 'block text-sm font-medium text-gray-700';

	return (
		<div className="relative inline-block">
			{label && <label className={labelClass}>{label}</label>}
			{isTextarea ? (
				<textarea
					ref={inputRef as React.RefObject<HTMLTextAreaElement>}
					className="input resize"
					value={value}
					onChange={handleChange}
					style={{ minWidth, paddingRight: '25px' }}
					{...rest}
				/>
			) : (
				<input
					ref={inputRef as React.RefObject<HTMLInputElement>}
					type="text"
					className="input resize"
					value={value}
					onChange={handleChange}
					style={{ minWidth, paddingRight: '25px' }}
					{...rest}
				/>
			)}
			<button
				onClick={handleCopyClick}
				className="absolute top-0 right-0 p-1 opacity-50 hover:opacity-100"
				title="Copy to clipboard"
				type="button"
			>
				<IoClipboardOutline />
			</button>
			{copySuccess && <span className="text-sm">{copySuccess}</span>}
		</div>
	);
};

export default CopyableTextInput;
