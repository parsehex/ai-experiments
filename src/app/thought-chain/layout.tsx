import '@/styles/globals.scss';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Thought Chain',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <span className={inter.className}>{children}</span>;
}
