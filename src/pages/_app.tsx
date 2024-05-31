import '@/styles/globals.scss';
import RootLayout from '@/components/Layout';

export default function App({ Component, pageProps }: any) {
	return (
		<RootLayout>
			<Component {...pageProps} />
		</RootLayout>
	);
}
