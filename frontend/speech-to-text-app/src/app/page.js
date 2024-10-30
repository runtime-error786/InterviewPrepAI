"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaMicrophone, FaKeyboard, FaSpinner } from "react-icons/fa";

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
  const [validating, setValidating] = useState(false);
  const [micError, setMicError] = useState(null);

  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null); 
  
  useEffect(() => {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        setMicError("Speech Recognition API is not supported by this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
            const finalTranscript = lastResult[0].transcript.trim();
            setTranscript((prev) => `${prev} ${finalTranscript}`);
        }
    };

    recognition.onend = () => {
      if (!isListening) {
        console.log("Recognition ended. Attempting restart...");
        restartWithDelay();
      } else {
        console.log("Recognition stopped manually.");
      }
    };
    
    recognition.onerror = (event) => {
      console.error(`Microphone error: ${event.error}`);
      setMicError(`Microphone error: ${event.error}`);
      setIsListening(false);
    
      if (event.error === "no-speech" || event.error === "aborted") {
        console.log("No speech detected or recognition aborted. Restarting...");
        if (!isListening) restartWithDelay(); 
      } else {
        console.log("Unhandled error, stopping recognition.");
        recognitionRef.current?.stop();
      }
    };
    

    recognitionRef.current = recognition;

    return () => {
        recognition.stop();
    };
}, [isListening]);

const restartWithDelay = () => {
  clearTimeout(restartTimeoutRef.current); 
  restartTimeoutRef.current = setTimeout(() => {
    console.log("Restarting recognition...");
    recognitionRef.current?.start();
  }, 100); 
};

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:3001/generate-question/",
        { past_questions: [question, ...pastQuestions] }
      );

      if (typeof response.data.question === "string") {
        setQuestion(response.data.question);
        setPastQuestions((prev) => [...prev, response.data.question]);
        resetState();
        speakText(response.data.question);
      } else {
        setQuestion("Error: Invalid question format.");
      }
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateAnswer = async (answer) => {
    setValidating(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:3001/validate-answer/",
        { question, answer }
      );

      if (response.data.is_correct === "yes") {
        setScore((prev) => prev + 1);
      }

      resetState();
      setQuestion("");
      setisshowlisten(true);
      setisshowwrite(true);
      recognitionRef.current?.stop();
    } catch (error) {
      console.error("Error validating answer:", error);
    } finally {
      setValidating(false);
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => {
      setShowOptions(true);
      setIsSpeaking(false);
    };
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!isListening) {
      setTranscript(""); 
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop(); 
      setIsListening(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white p-8">
      <h1 className="text-5xl md:text-6xl font-extrabold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500 animate-pulse">
        AI Quiz App
      </h1>

      <div className="absolute top-5 right-5 bg-indigo-500 text-white px-6 py-2 rounded-full shadow-md">
        <span className="font-semibold">Score: {score}</span>
      </div>

      {loading ? (
        <FaSpinner className="animate-spin text-6xl text-indigo-400" />
      ) : !question ? (
        <button
          onClick={fetchQuestion}
          className="px-10 py-4 bg-blue-600 hover:bg-blue-700 transition-all rounded-full text-2xl shadow-lg"
        >
          Generate Question
        </button>
      ) : (
        <div className="max-w-xl mx-auto text-center mt-8">
          <h2 className="text-3xl font-semibold mb-6">Question:</h2>
          <p className="p-6 bg-gray-800 rounded-lg shadow-md text-xl">
            {question}
          </p>
        </div>
      )}

      {micError && (
        <div className="mt-6 bg-red-600 text-white p-4 rounded-lg">
          <p>{micError}</p>
        </div>
      )}

      {showOptions && !isSpeaking && (
        <div className="mt-10 flex space-x-6">
          {isshowlisten && (
            <button
              onClick={() => {
                setInputMode("listening");
                setisshowwrite(false);
                setisshowlisten(false);
              }}
              className="flex items-center space-x-2 px-8 py-3 bg-green-500 hover:bg-green-600 rounded-full shadow-lg"
            >
              <FaMicrophone />
              <span>Use Voice</span>
            </button>
          )}
          {isshowwrite && (
            <button
              onClick={() => {
                setInputMode("text");
                setisshowlisten(false);
                setisshowwrite(false);
              }}
              className="flex items-center space-x-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg"
            >
              <FaKeyboard />
              <span>Type Answer</span>
            </button>
          )}
        </div>
      )}

      {inputMode === "listening" && (
        <div className="mt-10 max-w-md mx-auto text-center">
          <p className="text-xl mb-4">
            {transcript || "Listening... Speak your answer."}
          </p>
          <button
            onClick={toggleListening}
            className={`px-8 py-3 transition-all rounded-full shadow-lg ${
              isListening ? "bg-red-600 hover:bg-red-700" : "bg-yellow-500 hover:bg-yellow-600"
            }`}
          >
            {isListening ? "Stop Listening" : "Start Listening"}
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

      {inputMode === "text" && !validating && (
        <div className="mt-10 max-w-md mx-auto">
          <input
            type="text"
            value={inputAnswer}
            onChange={(e) => setInputAnswer(e.target.value)}
            className="w-full p-4 rounded-lg shadow-md text-black mb-4"
            placeholder="Type your answer here"
          />
          <button
            onClick={() => validateAnswer(inputAnswer)}
            className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg"
          >
            Submit Answer
          </button>
        </div>
      )}

      {validating && (
        <div className="mt-10 text-center">
          <p className="text-lg">Checking your answer...</p>
        </div>
      )}
    </div>
  );
}
