
# InterviewPrepAI



This project is an AI-powered  app that allows users to answer dynamically generated questions through voice or text input. The frontend, built with Next.js, interacts with the backend via API calls. When the user initiates a quiz, the app requests a new question from the backend and displays it. Users can choose to answer either by speaking (with speech recognition) or typing. If using voice input, the microphone listens continuously until the user stops it, appending the spoken words to the transcript. Once an answer is submitted, the app sends the question and answer to the backend for validation. If correct, the score increments, and the state resets for the next round. The app provides seamless user feedback, such as handling microphone errors, tracking past questions, and managing input modes to ensure smooth interaction between speech synthesis, listening, and question answering.
