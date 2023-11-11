import React, { useState, useRef } from 'react';

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

const HoverMenuButton: React.FC<HoverMenuButtonProps> = ({
	fields,
	onSubmit,
	label,
}) => {
	const initializeFormValues = () => {
		return fields.reduce((acc, field) => {
			acc[field.name] = field.defaultValue || '';
			return acc;
		}, {} as { [key: string]: any });
	};

	const [formValues, setFormValues] = useState<{ [key: string]: any }>(
		initializeFormValues()
	);
	const [showMenu, setShowMenu] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const handleFieldChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		let finalValue: any = value;
		if (fields.find((field) => field.name === name)?.type === 'number') {
			finalValue = parseInt(value);
		}
		setFormValues((prev) => ({ ...prev, [name]: finalValue }));
	};

	const handleClick = () => {
		onSubmit(formValues);
	};

	const renderField = (field: HoverMenuFormField) => {
		switch (field.type) {
			case 'text':
				return (
					<input
						type="text"
						className="input"
						name={field.name}
						placeholder={field.placeholder}
						value={formValues[field.name] || ''}
						onChange={handleFieldChange}
					/>
				);
			case 'number':
				return (
					<input
						type="number"
						className="input mx-2"
						name={field.name}
						value={formValues[field.name] || ''}
						style={{ width: '4rem' }}
						onChange={handleFieldChange}
					/>
				);
			case 'select':
				return (
					<div className="flex">
						{field.options?.map((option) => (
							<label key={option.value} className="flex items-center mr-2">
								<input
									type="radio"
									name={field.name}
									value={option.value}
									checked={formValues[field.name] === option.value}
									onChange={handleFieldChange}
									className="mr-2"
								/>
								{option.label}
							</label>
						))}
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div
			className="relative"
			onMouseEnter={() => setShowMenu(true)}
			onMouseLeave={() => setShowMenu(false)}
		>
			<button ref={buttonRef} onClick={handleClick} className="basic mx-3">
				{label}
			</button>
			{showMenu && (
				<div className="absolute left-0 p-2 bg-white rounded-md shadow-xl z-10">
					{fields.map((field) => (
						<label key={field.name} className="block" title={field.title || ''}>
							{field.label}
							{renderField(field)}
						</label>
					))}
				</div>
			)}
		</div>
	);
};

export default HoverMenuButton;
