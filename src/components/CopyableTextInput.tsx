import React, { useEffect, useRef, useState } from 'react';
import { IoClipboardOutline } from 'react-icons/io5';
import { v4 } from 'uuid';

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
	const uniqueId = v4();

	useEffect(() => {
		if (inputRef.current) {
			autoResize(inputRef.current);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, inputRef]);

	const autoResize = (element: HTMLInputElement | HTMLTextAreaElement) => {
		if (!element?.value) return;
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

			// update width
			const span = document.createElement('span');
			document.body.appendChild(span);

			span.style.font = window.getComputedStyle(textarea).font;
			span.style.display = 'inline-block';
			span.style.visibility = 'hidden';
			span.style.whiteSpace = 'pre-line';
			span.style.wordWrap = 'break-word';
			span.textContent = textarea.value.replace(/ /g, '\u00a0');

			let isSingleLine = textarea.value.indexOf('\n') === -1;
			// detect long lines
			if (isSingleLine) {
				// look at the text itself to judge, not the span
				const text = textarea.value;
				const words = text.split(' ');
				if (words.length > 100) {
					isSingleLine = false;
				}
				console.log('single line', text);
			}

			// change the width of the span to find a good width
			const startWidth = 100;
			const maxWidth = Math.round(window.innerWidth / 2);
			const increment = 10;
			// at diff widths, find where the width/height ratio is about 5
			let width = maxWidth;
			let heightRatio = 0;
			let prevHeight = 0;
			let prevWidth = startWidth;
			while (width > startWidth) {
				width -= increment;
				span.style.width = `${width}px`;
				const spanHeight = span.offsetHeight;
				heightRatio = spanHeight / width;
				if (heightRatio > 3) {
					// we've gone too far, so go back to the previous width
					width = prevWidth;
					break;
				}
				if (!isSingleLine && prevHeight > 0 && spanHeight > prevHeight) {
					// we're getting taller, so go back to the previous width
					width = prevWidth;
					break;
				}
				prevHeight = spanHeight;
				prevWidth = width;
			}

			textarea.style.width = `${width}px`;
			document.body.removeChild(span);
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
		// console.log(e.target.value);
		updateValue(e.target.value);
		autoResize(e.target);
	};
	const labelClass =
		labelOrientation === 'horizontal'
			? 'inline-block text-sm font-medium text-gray-700 mr-2'
			: 'block text-sm font-medium text-gray-700';

	return (
		<div className="relative inline-block">
			{label && (
				<label className={labelClass + ' align-top'} htmlFor={uniqueId}>
					{label}
				</label>
			)}
			{isTextarea ? (
				<textarea
					id={uniqueId}
					ref={inputRef as React.RefObject<HTMLTextAreaElement>}
					className="input resize"
					value={value}
					onChange={handleChange}
					style={{ minWidth, paddingRight: label ? '' : '25px' }}
					{...rest}
				/>
			) : (
				<input
					id={uniqueId}
					ref={inputRef as React.RefObject<HTMLInputElement>}
					type="text"
					className="input resize"
					value={value}
					onChange={handleChange}
					style={{ minWidth, paddingRight: label ? '' : '25px' }}
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
