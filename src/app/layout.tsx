import '@/styles/globals.scss';
import type { Metadata } from 'next';
import Layout from '@/components/Layout';
// import { usePathname } from 'next/navigation';
import { getPageTitle } from '@/pageTitleMap';
import { AI } from './action';

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// const pathname = usePathname();
	// const title = getPageTitle(pathname || '');
	const title = 'Test';

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width" />
				<title>{title}</title>
				<link rel="icon" href="/favicon.ico" />
			</head>
			<body>
				<AI>
					<Layout>{children}</Layout>
				</AI>
			</body>
		</html>
	);
}
