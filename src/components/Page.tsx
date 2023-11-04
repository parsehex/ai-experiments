import React, { ComponentType, FC } from 'react';
import '@/styles/page.scss';

interface WithPageOptions {
	title?: string;
	extraStyles?: string;
}

export function withPage<P>(options: WithPageOptions = {}) {
	return function wrapWithPage(WrappedComponent: ComponentType<P>) {
		const WithPageStyles: FC<P> = (props: P) => (
			<div className="page">
				{options.extraStyles && <style>{options.extraStyles}</style>}
				{options.title && <h2>{options.title}</h2>}
				{/* @ts-ignore */}
				<WrappedComponent {...props} />
			</div>
		);

		const displayName =
			WrappedComponent.displayName || WrappedComponent.name || 'Component';
		WithPageStyles.displayName = `withPage(${displayName})`;

		return WithPageStyles;
	};
}
