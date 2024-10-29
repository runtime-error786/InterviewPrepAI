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
  const [loading, setLoading] = useState(false);
  const [isshowlisten, setisshowlisten] = useState(true);
  const [isshowwrite, setisshowwrite] = useState(true);
  const [pastQuestions, setPastQuestions] = useState([]); 

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
      // If you want to stop listening after receiving a result, do it here
      // Uncomment the next line if you want to stop after getting a result
      // setIsListening(false);
    };

    recognition.onend = () => {
      // Only restart recognition if we're still listening
      if (isListening) {
        recognition.start(); // Restart recognition
      }
    };

    recognitionRef.current = recognition;
  }, [isListening]);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:3001/generate-question/", {
        past_questions: [question, ...pastQuestions] // Send past questions to the backend
      });
      console.log("Fetch Question Response:", response.data);
  
      if (typeof response.data.question === "string") {
        setQuestion(response.data.question);
        setPastQuestions((prev) => [...prev, response.data.question]); // Update past questions state
      } else {
        console.error("Received question is not a string:", response.data.question);
        setQuestion("Error: Invalid question format.");
      }
  
      resetState();
      speakText(response.data.question);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
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
      // Stop recognition only after submitting the answer
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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
    if (!isListening) {
      setTranscript("");
      setIsListening(true);
      recognitionRef.current.start(); // Start listening
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <h1 className="text-6xl font-extrabold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
        AI Quiz App
      </h1>

      {loading ? (
        <div className="flex items-center justify-center">
          <div className="loader"></div> {/* Custom loader style */}
        </div>
      ) : !question ? (
        <button
          onClick={fetchQuestion}
          className="px-10 py-4 bg-blue-600 rounded-lg hover:bg-blue-800 transition text-2xl shadow-lg"
        >
          Generate Question
        </button>
      ) : null}

      <div className="mt-8 text-center w-full max-w-lg">
        <h2 className="text-3xl font-semibold mb-4">Question:</h2>
        <p className="bg-gray-800 p-6 rounded-lg shadow-md text-lg">
          {question || "Click the button to get a new question."}
        </p>
      </div>

      {showOptions && !isSpeaking && (
        <div className="mt-12 text-center">
          <h2 className="text-3xl font-semibold mb-4">Choose Input Mode:</h2>
          <div className="flex justify-center space-x-8">
            {isshowlisten && (
              <button
                onClick={() => {
                  setInputMode("listening");
                  setisshowwrite(false);
                  setisshowlisten(false);
                }}
                className="px-8 py-4 bg-green-600 rounded-lg hover:bg-green-800 transition text-lg shadow-lg"
              >
                Start Listening
              </button>
            )}
            {isshowwrite && (
              <button
                onClick={() => {
                  setInputMode("text");
                  setisshowlisten(false);
                  setisshowwrite(false);
                }}
                className="px-8 py-4 bg-purple-600 rounded-lg hover:bg-purple-800 transition text-lg shadow-lg"
              >
                Enter Text
              </button>
            )}
          </div>
        </div>
      )}

      {inputMode === "listening" && (
        <div className="mt-12 w-full max-w-md text-center">
          <p className="text-lg mb-4">{transcript || "Listening... Speak your answer."}</p>
          <button
            onClick={toggleListening}
            className={`mt-4 px-8 py-4 ${
              isListening ? "bg-red-600" : "bg-yellow-500"
            } rounded-lg hover:bg-red-800 transition text-lg shadow-lg`}
          >
            {isListening ? "Listening..." : "Start Listening"}
          </button>

          {transcript && (
            <button
              onClick={() => validateAnswer(transcript)}
              className="mt-4 px-8 py-4 bg-blue-600 rounded-lg hover:bg-blue-800 transition text-lg w-full shadow-lg"
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
            className="w-full p-3 rounded-lg text-black shadow-md"
            placeholder="Type your answer here"
          />
          <button
            onClick={() => validateAnswer(inputAnswer)}
            className="mt-4 px-8 py-4 bg-blue-600 rounded-lg hover:bg-blue-800 transition text-lg w-full shadow-lg"
          >
            Send Answer
          </button>
        </div>
      )}

      <div className="mt-12 text-center">
        <h2 className="text-3xl font-semibold">Score: {score}</h2>
      </div>
    </div>
  );
}
