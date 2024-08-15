import React, { useCallback, useEffect, useRef, useState } from "react";
import Toast from ".";
import { CloseButton } from "../../common/Button";
import { ChatWebSocketURL, MOCKSI_RECORDING_STATE } from "../../consts";
import editIcon from "../../public/edit-icon.png";
import mocksiLogo from "../../public/icon/icon48.png";
import { getEmail, innerHTMLToJson } from "../../utils";
import { AppState } from "../AppStateContext";
import { Storage } from "../utils/Storage";

interface Message {
	content: string;
	role: "assistant" | "user";
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
	action: string;
	content: string;
	selector: string;
}

const ChatToast: React.FC<ChatToastProps> = React.memo(
	({ close, onChangeState }) => {
		const [messages, setMessages] = useState<Message[]>([]);
		const [isTyping, setIsTyping] = useState<boolean>(false);
		const [inputValue, setInputValue] = useState<string>("");
		const [email, setEmail] = useState<string>("");
		const [domData, setDomData] = useState<string>("");
		const wsRef = useRef<null | WebSocket>(null);
		const reconnectTimeoutRef = useRef<null | number>(null);

		const connectWebSocket = useCallback(async () => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				return;
			}
			const state = await Storage.getItem([MOCKSI_RECORDING_STATE]);
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
				let response: undefined | ResponseMessage;
				try {
					response = JSON.parse(event.data);
				} catch (error) {
					console.error("Error parsing JSON:", error);
					setMessages((prevMessages) => [
						...prevMessages,
						{ content: "Please try again.", role: "assistant" },
					]);
					return;
				}

				if (!response || !response.message || !response.message.content) {
					console.error("Invalid response:", response);
					setMessages((prevMessages) => [
						...prevMessages,
						{ content: "Please try again.", role: "assistant" },
					]);
					return;
				}

				const data = JSON.parse(response.message.content);
				// Continue processing the valid response...
				if (!data || !data.description || !data.modifications) {
					console.error("Invalid data:", data);
					setMessages((prevMessages) => [
						...prevMessages,
						{ content: "Please try again.", role: "assistant" },
					]);
					return;
				}

				setMessages((prevMessages) => [
					...prevMessages,
					{ content: data.description, role: "assistant" },
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
					case "append":
						element.insertAdjacentHTML("beforeend", mod.content);
						break;
					case "prepend":
						element.insertAdjacentHTML("afterbegin", mod.content);
						break;
					case "remove":
						element.remove();
						break;
					case "replace":
						element.innerHTML = mod.content;
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
				const newMessage: Message = { content: inputValue, role: "user" };
				setMessages((prevMessages) => [...prevMessages, newMessage]);
				setInputValue("");
				sendReply({ messages: [...messages, newMessage] });
			}
		};

		return (
			<Toast
				backgroundColor="mw-bg-gray-300"
				className="mw-relative mw-flex mw-flex-col mw-mt-1 mw-mr-6 mw-py-4 mw-h-[900px] mw-w-[800px]"
			>
				<div className="mw-top-0 mw-left-0 mw-absolute mw-m-2">
					<CloseButton
						onClick={async () => {
							await Storage.setItem({
								[MOCKSI_RECORDING_STATE]: AppState.CREATE,
							});
							close();
						}}
					/>
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
									<div className="avatar chat-image">
										<div className="mw-rounded-full mw-w-10">
											<img alt={`${msg.role} avatar`} src={msgIcon} />
										</div>
									</div>
									<div className="mw-bg-gray-200 chat-bubble">
										{msg.content}
									</div>
								</div>
							);
						})}
					</div>

					<form
						className="mw-items-center form-control"
						onSubmit={handleSubmit}
					>
						<div className="mw-relative mw-flex mw-items-center mw-w-[500px] max-w-full input-group">
							{isTyping && (
								<small className="-mw-top-5 mw-left-0.5 mw-absolute mw-animate-pulse">
									MocksiAI is thinking...
								</small>
							)}
							<input
								className="mw-flex-grow mw-bg-white mw-mr-2.5 input-bordered input"
								disabled={isTyping}
								onChange={(e) => setInputValue(e.currentTarget.value)}
								placeholder="Ask Mocksi a question..."
								required
								type="text"
								value={inputValue}
							/>
							<button
								className={`mw-btn mw-btn-square ${
									isTyping ? "mw-animate-pulse" : ""
								}`}
								disabled={isTyping}
								type="submit"
							>
								<svg
									className="mw-h-6 mw-w-6"
									fill="currentColor"
									viewBox="0 0 16 16"
									xmlns="http://www.w3.org/2000/svg"
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
