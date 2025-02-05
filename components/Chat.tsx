"use client";
import { useEffect, useRef, useState } from "react";
import { generateResponse, speechToText } from "../services/huggingface";
import { Bot, Mic, MicOff, User } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardFooter } from "./ui/card";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const newUserMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const botResponseText = await generateResponse(inputValue);

      // Typing animasyonu için biraz gecikme
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const botResponse: Message = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: "bot",
      };

      setMessages((prevMessages) => [...prevMessages, botResponse]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        sender: "bot",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = async (event) => {
          const audioBlob = event.data;
          // Burada ses verisini text'e çevireceğiz
          // Hugging Face'in speech-to-text modelini kullanacağız
          handleVoiceInput(audioBlob);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Mikrofon erişim hatası:", error);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceInput = async (audioBlob: Blob) => {
    try {
      // Ses verisini text'e çevirme
      const text = await speechToText(audioBlob); // speechToText fonksiyonunu huggingface.ts'den import edin
      if (text) {
        setInputValue(text);
        handleSendMessage();
      }
    } catch (error) {
      console.error("Ses işleme hatası:", error);
    }
  };

  const handleCorrection = async () => {
    if (inputValue.trim() === "") return;

    const prompt = `Please correct any grammatical errors in this sentence and explain the corrections: "${inputValue}"`;
    setIsLoading(true);
    setIsTyping(true);

    try {
      const botResponseText = await generateResponse(prompt);

      const correctionMessage: Message = {
        id: Date.now(),
        text: `Correction for "${inputValue}": ${botResponseText}`,
        sender: "bot",
      };

      setMessages((prevMessages) => [...prevMessages, correctionMessage]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };
  return (
    <div className="max-w-[1200px] mx-auto mt-10">
      <Card className="min-w-[1200px] rounded-xl shadow-lg">
        <CardContent className="h-96 overflow-y-auto space-y-4 p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  msg.sender === "user" ? "bg-blue-100" : "bg-gray-200"
                }`}
              >
                {msg.sender === "user" ? (
                  <User className="w-6 h-6 text-blue-500" />
                ) : (
                  <Bot className="w-6 h-6 text-gray-600" />
                )}
              </div>

              {/* Mesaj balonu */}
              <div
                className={`p-3 rounded-lg max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-blue-100 text-black"
                    : "bg-gray-200 text-black"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="w-6 h-6 text-gray-600" />
              </div>
              <div className="bg-gray-200 text-black p-3 rounded-lg">
                <div className="typing-animation">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="flex gap-2 p-4">
          <Button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-3 py-2"
          >
            😊
          </Button>
          <Button
            onClick={toggleRecording}
            className={`px-3 py-2 ${isRecording ? "bg-red-500" : ""}`}
          >
            {isRecording ? <MicOff /> : <Mic />}
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !isLoading && handleSendMessage()
            }
            placeholder="Mesajınızı yazın"
            className="flex-1 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            onClick={handleCorrection}
            className="bg-green-500 text-white"
            disabled={isLoading}
          >
            Düzelt
          </Button>
          <Button
            onClick={handleSendMessage}
            className="rounded-md px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Gönder
          </Button>
          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4">
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  setInputValue((prev) => prev + emojiObject.emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Chat;
