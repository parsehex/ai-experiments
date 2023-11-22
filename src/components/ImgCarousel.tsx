import '@/styles/carousel.scss';
import { useState } from 'react';
import LeftArrow from './svg/LeftArrow';
import RightArrow from './svg/RightArrow';
import { ImgType } from '@/lib/types';
import { IoDownloadOutline } from 'react-icons/io5';

const MIN_HEIGHT = 128;
const HEIGHT_MULTIPLIER = 3;

// TODO add download button which uses the anchor
// otherwise user must right click and save link as (rather than save image as)
//   if not then no filename is provided in the save dialog

interface ImgCarouselProps {
	images: ImgType[];
	maxContentHeight?: number;
	defaultExpanded?: boolean;
}

const ImgCarousel = ({
	images,
	maxContentHeight = 0,
	defaultExpanded = false,
}: ImgCarouselProps) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	const handleNext = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex + 1 === images.length ? 0 : prevIndex + 1
		);
	};
	const handlePrevious = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex - 1 < 0 ? images.length - 1 : prevIndex - 1
		);
	};
	const handleDotClick = (index: number) => {
		setCurrentIndex(index);
	};

	const getImageSrc = (i: number) => {
		const img = images[i];
		let image = '';
		if (typeof img === 'string') {
			image = img;
		} else {
			image = img.url;
		}
		if (image.startsWith('http') || image.startsWith('data:image'))
			return image;
		return image.startsWith('/')
			? `${window.location.origin}${image}`
			: `data:image/png;base64,${image}`;
	};
	const getImagePrompt = (i: number) => {
		const img = images[i];
		if (typeof img === 'string') {
			return '';
		} else {
			return img.prompt;
		}
	};

	const handleImageClick = () => {
		setIsExpanded(!isExpanded);
	};
	const imgAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};
	const calculatedMaxHeight = isExpanded
		? Math.max(maxContentHeight, MIN_HEIGHT) * HEIGHT_MULTIPLIER
		: Math.max(maxContentHeight, MIN_HEIGHT);
	const createAnchor = (href: string, download: string) => {
		const anchor = document.createElement('a');
		anchor.href = href;
		anchor.download = download;
		anchor.target = '_blank';
		anchor.rel = 'noreferrer';
		return anchor;
	};

	return (
		<div
			className="carousel-images"
			style={{ maxHeight: `${calculatedMaxHeight}px` }}
		>
			<a
				href={getImageSrc(currentIndex)}
				className="cursor-default"
				target="_blank"
				rel="noreferrer"
				download={Date.now().toString() + '.png'}
				onClick={imgAnchorClick}
			>
				<img
					key={currentIndex}
					title={getImagePrompt(currentIndex)}
					src={getImageSrc(currentIndex)}
					alt={`Carousel Image ${currentIndex + 1}`}
					style={{ maxHeight: `${calculatedMaxHeight}px` }}
					onClick={handleImageClick}
				/>
			</a>
			<div className="absolute h-5/6">
				<button
					className="green opacity-70 small relative z-10 p-1"
					style={{ left: '325%' }}
					aria-label="Download Image"
					title="Download Image"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						const parent = e.currentTarget.parentElement?.parentElement;
						const anchor = parent?.querySelector('a');
						if (anchor) {
							createAnchor(anchor.href, anchor.download).click();
						}
					}}
				>
					<IoDownloadOutline />
				</button>
			</div>
			{images.length > 1 && (
				<div className="slide_direction">
					<div
						className="left"
						onClick={handlePrevious}
						aria-label="Previous Image"
					>
						<LeftArrow />
					</div>
					<div className="right" onClick={handleNext} aria-label="Next Image">
						<RightArrow />
					</div>
				</div>
			)}
			<div className="carousel-indicator">
				{images.map((_, index) => (
					<div
						key={index}
						className={`dot ${currentIndex === index ? 'active' : ''}`}
						onClick={() => handleDotClick(index)}
						aria-label={`Image ${index + 1}`}
					></div>
				))}
			</div>
		</div>
	);
};

export default ImgCarousel;
