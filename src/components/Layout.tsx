import { useEffect } from 'react';
import * as ooba from '@/lib/ooba-api';
import Header from './Header';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
	useEffect(() => {
		(window as any).ooba = ooba;
	}, []);
	return (
		<>
			<Header />
			<main>{children}</main>
		</>
	);
};

export default RootLayout;
