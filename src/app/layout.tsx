'use client';
import '@/styles/globals.scss';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Layout from '@/components/Layout';
import { usePathname } from 'next/navigation';
import { getPageTitle } from '@/pageTitleMap';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const title = getPageTitle(pathname || '');

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width" />
				<title>{title}</title>
				<link rel="icon" href="/favicon.ico" />
				<link rel="stylesheet" href="/fonts/fonts.css" />
				<link rel="stylesheet" href="/fonts/inter.css" />
			</head>
			<body className={inter.className}>
				<Layout>{children}</Layout>
			</body>
		</html>
	);
}
