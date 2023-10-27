import streamlit as st
from llama_cpp import Llama

# Llama model setup
llm = Llama(model_path="./dolphin-2.1-mistral-7b.Q5_K_M.gguf", n_ctx=4096, n_gpu_layers=20)
# Few-shot examples for each phase
phase1_prompts = [
"Given the following examples of how to identify the necessary expertise and key concepts for various questions, please provide a similar structured response for the provided query, but don't give the final answer.",
"Q: What causes rainbows? A: The expertise required includes physics and atmospheric science. Key facts to consider are the refraction, dispersion, and reflection of sunlight in raindrops.",
"Q: How do airplanes fly? A: Expertise in aerodynamics and physics is essential. Consider the principles of lift, thrust, drag, and weight.",
"Q: Why is the sky blue? A: The necessary expertise lies in atmospheric science and optics. Consider the scattering of sunlight by Earth's atmosphere.",
"Q: What makes the ocean salty? A: Expertise in geology and chemistry is vital. Think about the erosion of rocks, which release salts, and the continuous addition of salts from rivers.",
"Q: How do plants produce food? A: Expertise in botany and biology is key. Consider the process of photosynthesis where plants convert sunlight into energy.",
"Q: Why does the moon have phases? A: Understanding this requires expertise in astronomy and physics. Key facts involve the moon's orbit around Earth and the relative positions of the Earth, moon, and sun."
]

phase2_prompts = [
# "Based on the following examples that demonstrate how to answer questions using specified expertise and key considerations, provide an in-depth response to the provided query.",
"Given expertise in physics and optics, Q: How does a magnifying glass magnify? A: It bends the light rays to make objects appear larger.",
"With expertise in biology and anatomy, Q: How does the heart pump blood? A: Through muscular contractions that create pressure, pushing blood throughout the body.",
"Considering knowledge in geology, Q: Why do volcanoes erupt? A: Due to movement of tectonic plates and pressure build-up beneath the Earth's crust.",
"Utilizing expertise in chemistry, Q: Why do certain substances dissolve in water? A: Due to the polarity of water molecules, they can surround and disperse certain solute particles, causing them to dissolve.",
"With an understanding in astronomy, Q: Why do stars twinkle? A: Stars twinkle because of the Earth's atmosphere; the air layers of varying temperatures and densities refract light differently, causing it to shimmer.",
"Drawing from knowledge in computer science, Q: What is an algorithm? A: An algorithm is a set of defined steps or procedures to solve a particular problem or accomplish a task.",
"Based on expertise in history, Q: Why did the Renaissance period occur? A: It was a cultural and intellectual revival, influenced by the rediscovery of classical art, literature, and spurred by economic growth and societal changes in Europe."
]

phase3_prompts = [
"Using the following examples as a guide for evaluating the accuracy of statements in response to questions, assess the veracity of the provided claim.",
"Q: Evaluate the accuracy of the statement: 'Water is a gas at room temperature'. A: The statement is inaccurate; water is a liquid at room temperature.",
"Q: Judge the claim: 'All humans need to eat three times a day for optimal health'. A: This claim is not universally accurate; dietary needs can vary widely based on various factors, including age, activity level, and health conditions.",
"Q: Assess the statement: 'Birds are mammals'. A: The claim is incorrect; birds belong to the class Aves, not Mammalia.",
"Q: Critique the assertion: 'All stars are just like our sun'. A: This assertion is not accurate; stars can vary greatly in size, temperature, color, and lifespan."
]
# Streamlit UI
st.title("Llama Expert System")
user_input = st.text_area("Enter your question:")
if st.button("Submit"):
	# Phase 1
	phase1_input = "\n".join(phase1_prompts) + f"\nQ: {user_input} A: "
	response = llm(phase1_input, max_tokens=100, stop=["Q:", "\n"], echo=True)
	first_output = response["choices"][0]["text"].split("\n")[-1]
	st.write(":orange[Phase 1:]", first_output)
	# Phase 2
	expertise_and_facts = first_output.split('A: ')[1]
	# phase2_input = "\n".join(phase2_prompts) + f"\n {expertise_and_facts}, Q: {user_input}? A: "
	phase2_input = "\n".join(phase2_prompts) + f"\n Based on the fact that {expertise_and_facts}, Q: {user_input}? A: "
	response_phase2 = llm(phase2_input, max_tokens=500, stop=["Q:", "\n"], echo=True)
	# response_phase2 = llm(phase2_input, max_tokens=500, stop=None, echo=True)
	second_output = response_phase2["choices"][0]["text"].split("\n")[-1]
	st.write(":blue[Phase 2:]", second_output)
	# Phase 3
	feedback_for_phase3 = "\n".join(phase3_prompts) + f"\nQ: Evaluate the accuracy of the statement in response to '{user_input}': '{second_output.split('A: ')[1]}'. A: "
	response_phase3 = llm(feedback_for_phase3, max_tokens=150, stop=["Q:", "\n"], echo=True)
	third_output = response_phase3["choices"][0]["text"].split("\n")[-1]
	st.write(":red[Phase 3:]", third_output)
# To run the Streamlit app
# Save this code in a file, say "llama_app.py", and then run in terminal:
# streamlit run llama_app.py
