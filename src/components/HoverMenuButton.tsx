import React, { useState, useRef } from 'react';

export interface HoverMenuFormField {
	type: 'text' | 'number' | 'select';
	label: string;
	name: string;
	options?: string[]; // For select type fields
	placeholder?: string; // For text type fields
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
	const [formValues, setFormValues] = useState<{ [key: string]: any }>({});
	const [showMenu, setShowMenu] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const handleFieldChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name } = e.target;
		let value = e.target.value as any;
		const type = fields.find((field) => field.name === name)?.type;
		if (type === 'number') value = parseInt(value);
		setFormValues((prev) => ({ ...prev, [name]: value }));
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
					<select
						className="input"
						name={field.name}
						value={formValues[field.name] || ''}
						onChange={handleFieldChange}
					>
						{field.options?.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
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
			<button ref={buttonRef} onClick={handleClick} className="mx-3">
				{label}
			</button>
			{showMenu && (
				<div className="absolute left-0 p-2 bg-white rounded-md shadow-xl z-10">
					{fields.map((field) => (
						<label key={field.name} className="block">
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
