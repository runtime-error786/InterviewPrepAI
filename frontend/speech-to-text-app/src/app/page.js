"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("");
  const [score, setScore] = useState(0);
  const [inputAnswer, setInputAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [inputMode, setInputMode] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false); // Loader state
  const [isshowlisten, setisshowlisten] = useState(true);
  const [isshowwrite, setisshowwrite] = useState(true);

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
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.onend = () => setIsListening(false);
  }, []);

  const fetchQuestion = async () => {
    setLoading(true); // Start loader
    try {
      const response = await axios.get("http://127.0.0.1:3001/generate-question/");
      console.log("Fetch Question Response:", response.data);

      if (typeof response.data.question === "string") {
        setQuestion(response.data.question);
      } else {
        console.error("Received question is not a string:", response.data.question);
        setQuestion("Error: Invalid question format.");
      }

      resetState();
      speakText(response.data.question);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false); // Stop loader
    }
  };

  const validateAnswer = async (answer) => {
    try {
      const response = await axios.post("http://127.0.0.1:3001/validate-answer/", {
        question: question,
        answer: answer,
      });

      console.log("Validate Answer Response:", response.data);

      if (response.data.is_correct === "yes") {
        setScore((prevScore) => prevScore + 1);
      }

      resetState();
      setQuestion("");
      setisshowlisten(true);
      setisshowwrite(true);
    } catch (error) {
      console.error("Error validating answer:", error);
    }
  };

  const resetState = () => {
    setTranscript("");
    setInputAnswer("");
    setInputMode("");
    setShowOptions(false);
    setIsSpeaking(false);
  };

  const speakText = (text) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => {
      setIsSpeaking(false);
      setShowOptions(true);
    };
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 to-black text-white p-6">
      <h1 className="text-5xl font-extrabold mb-10 text-center">AI Quiz App</h1>

      {loading ? ( // Loader when fetching question
        <div className="flex items-center justify-center">
          <div className="loader"></div> {/* Custom loader style */}
        </div>
      ) : !question ? ( // Show button only if no question is set
        <button
          onClick={fetchQuestion}
          className="px-8 py-4 bg-blue-600 rounded-lg hover:bg-blue-800 transition text-xl"
        >
          Generate Question
        </button>
      ) : null}

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-semibold">Question:</h2>
        <p className="text-lg mt-4">{question || "Click the button to get a new question."}</p>
      </div>

      {showOptions && !isSpeaking && ( // Show input mode options after question is spoken
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold">Choose Input Mode:</h2>
          <div className="flex justify-center space-x-6 mt-6">
            {isshowlisten && <button
              onClick={() => {
                setInputMode("listening"); // Set the input mode to listening
                setisshowwrite(false);
                setisshowlisten(false);
              }}
              className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-800 transition text-lg"
            >
              Start Listening
            </button>}
            {isshowwrite && <button
              onClick={() => {
                setInputMode("text"); // Set the input mode to listening
                setisshowlisten(false);
                setisshowwrite(false);
              }} className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-800 transition text-lg"
            >
              Enter Text
            </button>}
          </div>
        </div>
      )}

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

          {!isListening && transcript && ( // Show send button only after listening is done
            <button
              onClick={() => validateAnswer(transcript)}
              className="mt-4 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-800 transition text-lg w-full"
            >
              Send Answer
            </button>
          )}
        </div>
      )}

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
            Send Answer
          </button>
        </div>
      )}

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold">Score: {score}</h2>
      </div>
    </div>
  );
}
