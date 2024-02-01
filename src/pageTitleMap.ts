import { demos } from './demosList';

export const getPageTitle = (path: string) => {
	const demo = demos.find((d) => d.href === path);
	return demo?.title || 'Default Title';
};
