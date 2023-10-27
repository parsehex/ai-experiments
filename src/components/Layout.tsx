import Header from './Header';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			<Header />
			<main>{children}</main>
		</>
	);
};

export default RootLayout;
