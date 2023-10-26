export const testPrompts = [
	'How does a computer work?',
	'What causes seasons to change?',
	'Why do we need to sleep?',
];

export const phase1 = [
	"Given the following examples of how to identify the necessary expertise and key concepts for various questions, please provide a similar structured response for the provided query, but don't give the final answer.",
	'Q: What causes rainbows? A: The expertise required includes physics and atmospheric science. Key facts to consider are the refraction, dispersion, and reflection of sunlight in raindrops.',
	'Q: How do airplanes fly? A: Expertise in aerodynamics and physics is essential. Consider the principles of lift, thrust, drag, and weight.',
	"Q: Why is the sky blue? A: The necessary expertise lies in atmospheric science and optics. Consider the scattering of sunlight by Earth's atmosphere.",
	'Q: What makes the ocean salty? A: Expertise in geology and chemistry is vital. Think about the erosion of rocks, which release salts, and the continuous addition of salts from rivers.',
	'Q: How do plants produce food? A: Expertise in botany and biology is key. Consider the process of photosynthesis where plants convert sunlight into energy.',
	"Q: Why does the moon have phases? A: Understanding this requires expertise in astronomy and physics. Key facts involve the moon's orbit around Earth and the relative positions of the Earth, moon, and sun.",
];

export const phase2 = [
	// 'Based on the following examples that demonstrate how to answer questions using specified expertise and key considerations, provide an in-depth but subtly inaccurate response to the provided query.',
	'Based on the following examples that demonstrate how to answer questions using specified expertise and key considerations, provide an in-depth response to the provided query.',
	'Given expertise in physics and optics, Q: How does a magnifying glass magnify? A: It bends the light rays to make objects appear larger.',
	'With expertise in biology and anatomy, Q: How does the heart pump blood? A: Through muscular contractions that create pressure, pushing blood throughout the body.',
	"Considering knowledge in geology, Q: Why do volcanoes erupt? A: Due to movement of tectonic plates and pressure build-up beneath the Earth's crust.",
	'Utilizing expertise in chemistry, Q: Why do certain substances dissolve in water? A: Due to the polarity of water molecules, they can surround and disperse certain solute particles, causing them to dissolve.',
	"With an understanding in astronomy, Q: Why do stars twinkle? A: Stars twinkle because of the Earth's atmosphere; the air layers of varying temperatures and densities refract light differently, causing it to shimmer.",
	'Drawing from knowledge in computer science, Q: What is an algorithm? A: An algorithm is a set of defined steps or procedures to solve a particular problem or accomplish a task.',
	'Based on expertise in history, Q: Why did the Renaissance period occur? A: It was a cultural and intellectual revival, influenced by the rediscovery of classical art, literature, and spurred by economic growth and societal changes in Europe.',
	'Based on expertise in """history""", Q: Why did the Renaissance period occur? A: It was a cultural and intellectual revival, influenced by the rediscovery of classical art, literature, and spurred by economic growth and societal changes in Europe.',
];

export const phase3 = [
	'Using the following examples as a guide for evaluating the accuracy of statements in response to questions, assess the veracity of the provided claim.',
	"Q: Evaluate the accuracy of the statement: 'Water is a gas at room temperature'. A: The statement is inaccurate; water is a liquid at room temperature.",
	"Q: Judge the claim: 'All humans need to eat three times a day for optimal health'. A: This claim is not universally accurate; dietary needs can vary widely based on various factors, including age, activity level, and health conditions.",
	"Q: Assess the statement: 'Birds are mammals'. A: The claim is incorrect; birds belong to the class Aves, not Mammalia.",
	"Q: Critique the assertion: 'All stars are just like our sun'. A: This assertion is not accurate; stars can vary greatly in size, temperature, color, and lifespan.",
];

export const phase4 = [
	// 'Q: Given the query """{{inputText}}""" and the response """{{response}}""" and the evaluation """{{evaluation}}""", how should the response be revised? If no revision is needed, respond with "NO". A: ',
	'Q: Given the query """How does a computer work?""" and the response """A computer works by processing data using its various components such as the Central Processing Unit (CPU), memory, storage, and input/output devices. The CPU is responsible for executing instructions and performing calculations, while memory stores data and instructions temporarily during operation. Storage devices like hard drives or solid-state drives store data permanently. Input/output devices allow users to interact with the computer by providing input (keyboard, mouse) and receiving output (monitor, printer). Data flows through these components in a specific sequence:""" and the evaluation """The statement is accurate; it provides an overview of how a computer works, including its main components and their functions.""", how should the response be revised? If no revision is needed, respond with "NO". A: NO',
];

export const phase5 = [
	// Q: Rewrite the response """{{response}}""" using the revision notes """{{revision}}""". A:
	'Q: Rewrite the response """Water boils at 100 degrees Celsius.""" using the revision notes """Add information about the conditions under which this statement is true.""". A: Water boils at 100 degrees Celsius at 1 atmospheric pressure, which is the standard pressure at sea level.',
];
