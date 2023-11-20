import '@/styles/carousel.scss';
import { useState } from 'react';
import LeftArrow from './svg/LeftArrow';
import RightArrow from './svg/RightArrow';

const MIN_HEIGHT = 128;
const HEIGHT_MULTIPLIER = 3;

interface ImgCarouselProps {
	images: string[];
	maxContentHeight?: number;
}

const ImgCarousel = ({ images, maxContentHeight = 0 }: ImgCarouselProps) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isExpanded, setIsExpanded] = useState(false);

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

	const getImageSrc = (image: string) => {
		if (image.startsWith('http') || image.startsWith('data:image'))
			return image;
		return image.startsWith('/')
			? `${window.location.origin}${image}`
			: `data:image/png;base64,${image}`;
	};

	const handleImageClick = () => {
		setIsExpanded(!isExpanded);
	};
	const calculatedMaxHeight = isExpanded
		? Math.max(maxContentHeight, MIN_HEIGHT) * HEIGHT_MULTIPLIER
		: Math.max(maxContentHeight, MIN_HEIGHT);

	return (
		<div
			className="carousel-images"
			style={{ maxHeight: `${calculatedMaxHeight}px` }}
		>
			<img
				key={currentIndex}
				src={getImageSrc(images[currentIndex])}
				alt={`Carousel Image ${currentIndex + 1}`}
				style={{ maxHeight: `${calculatedMaxHeight}px` }}
				onClick={handleImageClick}
			/>
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
