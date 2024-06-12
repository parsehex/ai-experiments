'use client';
import { getPageTitle } from '@/pageTitleMap';
import { usePathname } from 'next/navigation';
import 'react-tooltip/dist/react-tooltip.css';
function Header() {
	const pathname = usePathname();
	const title = getPageTitle(pathname || '');
	return (
		<header className="flex items-center">
			<nav>
				<ul className="flex flex-row">
					<li>
						<a href="/">Home</a>
					</li>
				</ul>
			</nav>
			<span className="ml-1 text-lg italic">{title}</span>
		</header>
	);
}

export default Header;
