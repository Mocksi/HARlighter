import React, { useCallback, useEffect, useState, useRef } from "react";
import Toast from ".";
import Button, { Variant } from "../../common/Button";
import { ChatWebSocketURL, MOCKSI_RECORDING_STATE } from "../../consts";
import closeIcon from "../../public/close-icon.png";
import editIcon from "../../public/edit-icon.png";
import mocksiLogo from "../../public/icon/icon48.png";
import { getEmail, getLastPageDom, innerHTMLToJson } from "../../utils";
import { AppState } from "../AppStateContext";

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
	onChangeState: (r: AppState) => void;
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
			if (!state || state[MOCKSI_RECORDING_STATE] !== AppState.CHAT) {
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
				className="mw-relative mw-flex mw-flex-col mw-py-4 mw-w-[800px] mw-mr-6 mw-mt-1 mw-h-[900px]"
				backgroundColor="mw-bg-gray-300"
			>
				<div className="mw-absolute mw-top-0 mw-left-0 mw-m-2">
					<Button
						variant={Variant.secondary}
						onClick={async () => {
							await chrome.storage.local.set({
								[MOCKSI_RECORDING_STATE]: AppState.CREATE,
							});
							close();
						}}
					>
						<img src={closeIcon} alt="closeIcon" />
					</Button>
				</div>
				<div className="mw-flex mw-flex-col mw-justify-center mw-items-center mw-gap-6 mw-mt-[75px] mw-h-full">
					<div className="mw-flex-grow overflow-auto">
						{messages.map((msg, i) => {
							const chatKey = `chatKey${i}`;
							const msgIcon = msg.role === "assistant" ? mocksiLogo : editIcon;
							const responseDivClassName =
								msg.role === "assistant" ? "mw-chat-start" : "mw-chat-end";
							return (
								<div className={responseDivClassName} key={chatKey}>
									<div className="chat-image avatar">
										<div className="mw-w-10 mw-rounded-full">
											<img src={msgIcon} alt={`${msg.role} avatar`} />
										</div>
									</div>
									<div className="chat-bubble mw-bg-gray-200">
										{msg.content}
									</div>
								</div>
							);
						})}
					</div>

					<form
						className="form-control mw-items-center"
						onSubmit={handleSubmit}
					>
						<div className="input-group max-w-full mw-w-[500px] mw-relative mw-flex mw-items-center">
							{isTyping && (
								<small className="mw-absolute -mw-top-5 mw-left-0.5 animate-pulse">
									MocksiAI is thinking...
								</small>
							)}

							<input
								type="text"
								placeholder="Ask Mocksi a question..."
								className="input input-bordered mw-flex-grow mw-mr-2.5 mw-bg-white"
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
									className="mw-h-6 mw-w-6"
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
