import React, { useState } from 'react';
import AIModelStatus from '@/components/AIModelStatus';

function ModelStatusDemo() {
	return (
		<div>
			<AIModelStatus type="llm" />
			<AIModelStatus type="tts" />
			<AIModelStatus type="img" />
		</div>
	);
}

export default ModelStatusDemo;
