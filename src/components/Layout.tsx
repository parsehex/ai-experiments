import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import Header from './Header';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			<Header />
			<main>{children}</main>
			<ToastContainer
				position="bottom-center"
				autoClose={3000}
			/>
		</>
	);
};

export default RootLayout;
