"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("");
  const [score, setScore] = useState(0);
  const [inputAnswer, setInputAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [inputMode, setInputMode] = useState(""); // "listening" or "text"
  const [showOptions, setShowOptions] = useState(false); // To control visibility of input options
  const [isSpeaking, setIsSpeaking] = useState(false); // To track if the question is being spoken

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const userAnswer = event.results[0][0].transcript;
      setTranscript(userAnswer);
      setIsListening(false); // Stop listening after getting the result
    };

    recognitionRef.current = recognition;
    recognition.onend = () => setIsListening(false); // Ensure state reflects the listening status
  }, []);

  // Fetch a new question from the backend
  const fetchQuestion = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:3001/generate-question/");
      setQuestion(response.data.question);
      resetState(); // Reset everything when a new question arrives
      speakText(response.data.question); // Speak the question
    } catch (error) {
      console.error("Error fetching question:", error);
    }
  };

  // Reset input and options when a new question is fetched
  const resetState = () => {
    setTranscript("");
    setInputAnswer("");
    
    setInputMode("");
    setShowOptions(false); // Hide options until the question is spoken
    setIsSpeaking(false); // Reset speaking status
  };

  // Use Speech Synthesis API to speak the question
  const speakText = (text) => {
    setIsSpeaking(true); // Indicate that the question is being spoken
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => {
      setIsSpeaking(false); // Reset speaking status
      setShowOptions(true); // Show input options after speaking the question
    };
    window.speechSynthesis.speak(utterance);
  };

  // Start or stop listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

const validateAnswer = async (answer) => {
  try {
      const response = await axios.post("http://127.0.0.1:3001/validate-answer/", {
          question: question,
          answer: answer,
      });

      console.log(response.data);

      if (response.data.is_correct === "yes") {
          setScore((prevScore) => prevScore + 1); 
      }

      resetState();
      setQuestion("");
  } catch (error) {
      console.error("Error validating answer:", error);
  }
};


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 to-black text-white p-6">
      <h1 className="text-5xl font-extrabold mb-10 text-center">AI Quiz App</h1>

      {/* Button to generate a new question */}
      {!isSpeaking && (
        <button
          onClick={fetchQuestion}
          className="px-8 py-4 bg-blue-600 rounded-lg hover:bg-blue-800 transition text-xl"
        >
          Generate Question & Start
        </button>
      )}

      {/* Display the question */}
      <div className="mt-10 text-center">
        <h2 className="text-2xl font-semibold">Question:</h2>
        <p className="text-lg mt-4">{question || "Click the button to get a new question."}</p>
      </div>

      {/* Show input mode options after question is spoken */}
      {showOptions && (
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold">Choose Input Mode:</h2>
          <div className="flex justify-center space-x-6 mt-6">
            <button
              onClick={() => setInputMode("listening")}
              className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-800 transition text-lg"
            >
              Start Listening
            </button>
            <button
              onClick={() => setInputMode("text")}
              className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-800 transition text-lg"
            >
              Enter Text
            </button>
          </div>
        </div>
      )}

      {/* Listening mode: Show transcript and submit button */}
      {inputMode === "listening" && (
        <div className="mt-12 w-full max-w-md text-center">
          <p className="text-lg">
            {transcript || "Listening... Speak your answer."}
          </p>
          <button
            onClick={toggleListening}
            className={`mt-4 px-6 py-3 ${isListening ? "bg-red-600" : "bg-yellow-500"} rounded-lg hover:bg-red-800 transition text-lg`}
          >
            {isListening ? "Stop Listening" : "Start Listening"}
          </button>

          {/* Show Submit button only when listening is complete */}
          {!isListening && transcript && (
            <button
              onClick={() => validateAnswer(transcript)}
              className="mt-4 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-800 transition text-lg w-full"
            >
              Submit Answer
            </button>
          )}
        </div>
      )}

      {/* Text input mode: Show input field and submit button */}
      {inputMode === "text" && (
        <div className="mt-12 w-full max-w-md text-center">
          <input
            type="text"
            value={inputAnswer}
            onChange={(e) => setInputAnswer(e.target.value)}
            className="w-full p-3 rounded-lg text-black"
            placeholder="Type your answer here"
          />
          <button
            onClick={() => validateAnswer(inputAnswer)}
            className="mt-4 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-800 transition text-lg w-full"
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Display the score */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold">Score: {score}</h2>
      </div>
    </div>
  );
}
