import React, { useCallback, useEffect, useState, useRef } from "react";
import Toast from ".";
import Button, { Variant } from "../../common/Button";
import type { RecordingState } from "../../consts";
import closeIcon from "../../public/close-icon.png";
import mocksiLogo from "../../public/icon/icon48.png";
import playIcon from "../../public/play-icon.png";
import { getLastPageDom } from "../../utils";

interface Message {
	role: "assistant" | "user";
	content: string;
}

interface ChatToastProps {
	close: () => void;
	onChangeState: (r: RecordingState) => void;
}

const REQUEST_CHAT = "requestChat";
const STORAGE_KEY = "chatMessages2";

const ChatToast: React.FC<ChatToastProps> = React.memo(
	({ onChangeState, close }) => {
		const [messages, setMessages] = useState<Message[]>([]);
		const [isTyping, setIsTyping] = useState<boolean>(false);
		const [inputValue, setInputValue] = useState<string>("");
		const messageListenerRef = useRef<
			((request: any, sender: any, sendResponse: any) => void) | null
		>(null);

		useEffect(() => {
			chrome.storage.local.get([STORAGE_KEY], (result) => {
				if (chrome.runtime.lastError) {
					console.error("Error loading messages:", chrome.runtime.lastError);
					return;
				}
				if (result[STORAGE_KEY]) {
					setMessages(JSON.parse(result[STORAGE_KEY]));
				}
			});
		}, []);

		useEffect(() => {
			chrome.storage.local.set(
				{ [STORAGE_KEY]: JSON.stringify(messages) },
				() => {
					if (chrome.runtime.lastError) {
						console.error("Error saving messages:", chrome.runtime.lastError);
					}
				},
			);
		}, [messages]);

		const sendChatRequest = useCallback(
			(messageBody: { messages: Message[] }) => {
				getLastPageDom().then((domData) => {
					console.log("DOM Data:", domData);
					const jsonData = {
						messageBody,
					};

					const payload = {
						type: "requestChat",
						json_data: jsonData,
						user_id: "user123", // Replace with actual user ID
						session_id: "session456", // Replace with actual session ID
						event_timestamp: new Date().toISOString(),
					};

					chrome.runtime.sendMessage(
						{ message: REQUEST_CHAT, body: payload },
						() => setIsTyping(false),
					);
				});
			},
			[],
		);

		const handleMessage = useCallback((request: any) => {
			if (request.type === "ChatResponse") {
				try {
					const decodedBase64 = atob(request.body);
					const decodedURL = decodeURIComponent(decodedBase64);
					const parsedData = JSON.parse(decodedURL);

					if (parsedData.chat_message) {
						const newMessage: Message = {
							role: "assistant",
							content: parsedData.chat_message,
						};
						setMessages((prevMessages) => [...prevMessages, newMessage]);
						setIsTyping(false);
					}
				} catch (error) {
					console.error("Error parsing ChatResponse:", error);
				}
			}
		}, []);

		useEffect(() => {
			if (messageListenerRef.current) {
				chrome.runtime.onMessage.addListener(messageListenerRef.current);
			}
			// Send initial request
			sendChatRequest({ messages: [] });

			messageListenerRef.current = (
				request: any,
				_sender: any,
				_sendResponse: any,
			) => {
				handleMessage(request);
				_sendResponse({ status: "success" });
				return true;
			};
		}, [handleMessage, sendChatRequest]);

		const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if (inputValue.trim()) {
				const newMessage: Message = { role: "user", content: inputValue };
				setMessages((prevMessages) => [...prevMessages, newMessage]);
				setInputValue("");
				sendChatRequest({ messages: [...messages, newMessage] });
			}
		};

		return (
			<Toast
				className="relative flex flex-col py-4 w-[800px] mr-6 mt-1 h-[900px]"
				backgroundColor="bg-gray-300"
			>
				<div className="absolute top-0 left-0 m-2">
					<Button variant={Variant.secondary} onClick={close}>
						<img src={closeIcon} alt="closeIcon" />
					</Button>
				</div>
				<div className="flex flex-col justify-center items-center gap-6 mt-[75px] h-full">
					<div className="flex-grow overflow-auto">
						{messages.map((msg, i) => {
							const chatKey = `chatKey${i}`;
							const msgIcon = msg.role === "assistant" ? playIcon : mocksiLogo;
							return (
								<div
									className={`chat ${
										msg.role === "assistant" ? "chat-start" : "chat-end"
									}`}
									key={chatKey}
								>
									<div className="chat-image avatar">
										<div className="w-10 rounded-full">
											<img src={msgIcon} alt={`${msg.role} avatar`} />
										</div>
									</div>
									<div className="chat-bubble bg-gray-200">{msg.content}</div>
								</div>
							);
						})}
					</div>

					<form className="form-control items-center" onSubmit={handleSubmit}>
						<div className="input-group max-w-full w-[500px] relative flex items-center">
							{isTyping && (
								<small className="absolute -top-5 left-0.5 animate-pulse">
									MocksiAI is typing...
								</small>
							)}

							<input
								type="text"
								placeholder="Ask Mocksi a question..."
								className="input input-bordered flex-grow mr-2.5 bg-white"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								required
								disabled={isTyping}
							/>
							<button
								className="btn btn-square"
								type="submit"
								disabled={isTyping}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 16 16"
								>
									<title>Send</title>
									<path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
								</svg>
							</button>
						</div>
					</form>
				</div>
			</Toast>
		);
	},
);

export default ChatToast;
