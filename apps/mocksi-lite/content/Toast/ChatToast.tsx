import { useState } from "react";
import Toast from ".";
import mocksiLogo from "../../public/icon/icon48.png";
import playIcon from "../../public/play-icon.png";

interface Message {
	role: "assistant" | "user";
	content: string;
}

const ChatToast = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isTyping, setIsTyping] = useState<boolean>(false);
	const [inputValue, setInputValue] = useState<string>("");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const newMessage: Message = { role: "user", content: inputValue };
		setMessages([...messages, newMessage]);
		setInputValue("");

		setIsTyping(true);

		// Simulate an API call to get a response from Mocksi
		const responseMessage: Message = {
			role: "assistant",
			content: "Mocksi is the best",
		};
		setTimeout(() => {
			setMessages([...messages, newMessage, responseMessage]);
			setIsTyping(false);
		}, 1000); // Simulated delay
	};

	return (
		<Toast
			className="flex-col py-4 w-[800px] mr-6 mt-1"
			backgroundColor="bg-gray-300"
		>
			<div
				className={"flex flex-col justify-center items-center gap-6 mt-[75px]"}
			>
				<div className="flex-grow overflow-auto">
					{messages.length > 0 &&
						messages.map((msg, i) => {
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
								Mocksi is typing...
							</small>
						)}

						<input
							type="text"
							placeholder="Ask Mocksi a question..."
							className="input input-bordered flex-grow mr-2.5"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							required
						/>
						<button className="btn btn-square" type="submit">
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
};

export default ChatToast;
