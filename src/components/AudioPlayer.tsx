import React from 'react';

interface AudioPlayerProps {
	audioUrl: string | null;
}

function AudioPlayer({ audioUrl }: AudioPlayerProps) {
	if (!audioUrl) return null;

	return (
		<div className="audio-player">
			<audio controls autoPlay>
				<source src={audioUrl} type="audio/mpeg" />
				Your browser does not support the audio element.
			</audio>
		</div>
	);
}

export default AudioPlayer;
