import React, { useCallback, useEffect, useState, useRef } from "react";
import Toast from ".";
import Button, { Variant } from "../../common/Button";
import {
	ChatWebSocketURL,
	MOCKSI_RECORDING_STATE,
	RecordingState,
} from "../../consts";
import closeIcon from "../../public/close-icon.png";
import editIcon from "../../public/edit-icon.png";
import mocksiLogo from "../../public/icon/icon48.png";
import { getEmail, getLastPageDom, innerHTMLToJson } from "../../utils";

interface Message {
	role: "assistant" | "user";
	content: string;
}

interface ResponseMessage {
	message: {
		content: string;
	};
}

interface ChatToastProps {
	close: () => void;
	onChangeState: (r: RecordingState) => void;
}

interface DOMModification {
	selector: string;
	action: string;
	content: string;
}

const ChatToast: React.FC<ChatToastProps> = React.memo(
	({ onChangeState, close }) => {
		const [messages, setMessages] = useState<Message[]>([]);
		const [isTyping, setIsTyping] = useState<boolean>(false);
		const [inputValue, setInputValue] = useState<string>("");
		const [email, setEmail] = useState<string>("");
		const [domData, setDomData] = useState<string>("");
		const wsRef = useRef<WebSocket | null>(null);
		const reconnectTimeoutRef = useRef<number | null>(null);

		const connectWebSocket = useCallback(async () => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				return;
			}
			const state = await chrome.storage.local.get([MOCKSI_RECORDING_STATE]);
			if (!state || state[MOCKSI_RECORDING_STATE] !== RecordingState.CHAT) {
				return;
			}

			wsRef.current = new WebSocket(ChatWebSocketURL);

			wsRef.current.onopen = () => {
				console.log("WebSocket connected");
				if (reconnectTimeoutRef.current) {
					clearTimeout(reconnectTimeoutRef.current);
					reconnectTimeoutRef.current = null;
				}
				setIsTyping(false);
			};

			wsRef.current.onmessage = async (event) => {
				let response: ResponseMessage | undefined;
				try {
					response = JSON.parse(event.data);
				} catch (error) {
					console.error("Error parsing JSON:", error);
					setMessages((prevMessages) => [
						...prevMessages,
						{ role: "assistant", content: "Please try again." },
					]);
					return;
				}

				if (!response || !response.message || !response.message.content) {
					console.error("Invalid response:", response);
					setMessages((prevMessages) => [
						...prevMessages,
						{ role: "assistant", content: "Please try again." },
					]);
					return;
				}

				const data = JSON.parse(response.message.content);
				// Continue processing the valid response...
				if (!data || !data.description || !data.modifications) {
					console.error("Invalid data:", data);
					setMessages((prevMessages) => [
						...prevMessages,
						{ role: "assistant", content: "Please try again." },
					]);
					return;
				}

				setMessages((prevMessages) => [
					...prevMessages,
					{ role: "assistant", content: data.description },
				]);

				try {
					await applyDOMModifications(data.modifications);
					setIsTyping(false);
					await new Promise((resolve) => window.setTimeout(resolve, 1000));
					const updatedDomJson = innerHTMLToJson(document.body.innerHTML);
					setDomData(updatedDomJson);
				} catch (error) {
					console.error("Error applying DOM modifications:", error);
				}
			};

			wsRef.current.onerror = (error) => {
				console.error("WebSocket error:", error);
			};

			wsRef.current.onclose = (event) => {
				console.log("WebSocket closed. Attempting to reconnect...");
				if (!reconnectTimeoutRef.current) {
					reconnectTimeoutRef.current = window.setTimeout(() => {
						connectWebSocket();
					}, 3000); // Attempt to reconnect after 3 seconds
				}
			};
		}, []);

		useEffect(() => {
			const dom_as_json = innerHTMLToJson(document.body.innerHTML);
			setDomData(dom_as_json);

			connectWebSocket();

			getEmail().then((email) => {
				setEmail(email || "");
			});

			return () => {
				if (wsRef.current) {
					wsRef.current.close();
				}
				if (reconnectTimeoutRef.current) {
					clearTimeout(reconnectTimeoutRef.current);
				}
			};
		}, [connectWebSocket]);

		const applyDOMModifications = async (modifications: DOMModification[]) => {
			for (const mod of modifications) {
				const element = document.querySelector(mod.selector);
				if (!element) {
					console.warn(`Element not found for selector: ${mod.selector}`);
					continue;
				}

				switch (mod.action) {
					case "replace":
						element.innerHTML = mod.content;
						break;
					case "append":
						element.insertAdjacentHTML("beforeend", mod.content);
						break;
					case "prepend":
						element.insertAdjacentHTML("afterbegin", mod.content);
						break;
					case "remove":
						element.remove();
						break;
					default:
						console.warn(`Unknown action: ${mod.action}`);
				}

				// Add a small delay between modifications to avoid overwhelming the browser
				await new Promise((resolve) => window.setTimeout(resolve, 100));
			}
		};

		const sendReply = useCallback(
			(messageBody: { messages: Message[] }) => {
				setIsTyping(true);
				if (wsRef.current?.readyState === WebSocket.OPEN) {
					const payload = JSON.stringify({ ...messageBody, domData, email });
					console.log(`sending payload: ${payload}`);
					wsRef.current.send(payload);
				} else {
					setIsTyping(true);
					console.error("WebSocket is not open. Attempting to reconnect...");
					connectWebSocket();
				}
			},
			[email, domData, connectWebSocket],
		);

		const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if (inputValue.trim()) {
				const newMessage: Message = { role: "user", content: inputValue };
				setMessages((prevMessages) => [...prevMessages, newMessage]);
				setInputValue("");
				sendReply({ messages: [...messages, newMessage] });
			}
		};

		return (
			<Toast
				className="relative flex flex-col py-4 w-[800px] mr-6 mt-1 h-[900px]"
				backgroundColor="bg-gray-300"
			>
				<div className="absolute top-0 left-0 m-2">
					<Button
						variant={Variant.secondary}
						onClick={async () => {
							await chrome.storage.local.set({
								[MOCKSI_RECORDING_STATE]: RecordingState.CREATE,
							});
							close();
						}}
					>
						<img src={closeIcon} alt="closeIcon" />
					</Button>
				</div>
				<div className="flex flex-col justify-center items-center gap-6 mt-[75px] h-full">
					<div className="flex-grow overflow-auto">
						{messages.map((msg, i) => {
							const chatKey = `chatKey${i}`;
							const msgIcon = msg.role === "assistant" ? mocksiLogo : editIcon;
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
									MocksiAI is thinking...
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
								className={`btn btn-square ${isTyping ? "animate-pulse" : ""}`}
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
