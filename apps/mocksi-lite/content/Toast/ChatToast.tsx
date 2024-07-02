import React, { useCallback, useEffect, useState, useRef } from "react";
import { XmlParser, Xslt } from "xslt-processor";
import Toast from ".";
import Button, { Variant } from "../../common/Button";
import { ChatWebSocketURL, type RecordingState } from "../../consts";
import closeIcon from "../../public/close-icon.png";
import editIcon from "../../public/edit-icon.png";
import mocksiLogo from "../../public/icon/icon48.png";
import { getEmail, getLastPageDom } from "../../utils";

interface Message {
	role: "assistant" | "user";
	content: string;
}

interface ChatToastProps {
	close: () => void;
	onChangeState: (r: RecordingState) => void;
}

let ws: WebSocket;

async function applyXMLTransformation(html: string, xslt: string): Promise<string> {
	console.log("Applying XSLT transformation to HTML:", html);
	console.log("XSLT:", xslt);
  
	// Convert HTML to well-formed XML
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const serializer = new XMLSerializer();
	const wellFormedXml = serializer.serializeToString(doc.documentElement);
  
	// Wrap the well-formed XML in a root element
	const wrappedXml = `<root>${wellFormedXml}</root>`;
  
	// Create XML and XSLT documents
	const xmlDoc = parser.parseFromString(wrappedXml, 'text/xml');
	const xsltDoc = parser.parseFromString(xslt, 'text/xml');
  
	// Perform the transformation
	const processor = new XSLTProcessor();
	processor.importStylesheet(xsltDoc);
	const resultDoc = processor.transformToDocument(xmlDoc);
  
	// Extract the transformed content
	const resultXml = serializer.serializeToString(resultDoc);
  
	// Remove the root element we added and convert back to HTML
	const transformedHtml = resultXml.replace(/<\/?root>/g, '');
	const finalDoc = parser.parseFromString(transformedHtml, 'text/html');
	return serializer.serializeToString(finalDoc.body);
  }
  

// Helper function to convert the modified_html array to an HTML string
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function convertModifiedHtmlToString(modifiedHtml: any[]): string {
	const parser = new DOMParser();
	const doc = parser.parseFromString("", "text/html");
  
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
  	function createElementFromJson(json: any): HTMLElement {
	  const el = doc.createElement(json.tag);
	  if (json.attributes) {
		for (const [key, value] of Object.entries(json.attributes)) {
		  el.setAttribute(key, value as string);
		}
	  }
	  if (json.text) {
		el.textContent = json.text;
	  }
	  if (json.children && Array.isArray(json.children)) {
		for (const child of json.children) {
		  el.appendChild(createElementFromJson(child));
		}
	  }
	  return el;
	}
  
	const rootElement = doc.createElement("div");
	for (const item of modifiedHtml) {
	  rootElement.appendChild(createElementFromJson(item));
	}

	return rootElement.innerHTML;
  }
  

const ChatToast: React.FC<ChatToastProps> = React.memo(
	({ onChangeState, close }) => {
		const [messages, setMessages] = useState<Message[]>([]);
		const [isTyping, setIsTyping] = useState<boolean>(false);
		const [inputValue, setInputValue] = useState<string>("");
		const [email, setEmail] = useState<string>("");
		const [domData, setDomData] = useState<string>("");
		const wsRef = useRef<WebSocket | null>(null);

		useEffect(() => {
			getLastPageDom().then((domData) => {
				setDomData(domData);
			});
			wsRef.current = new WebSocket(ChatWebSocketURL);
			wsRef.current.onmessage = async (event) => {
				try {
				  const response = JSON.parse(event.data);
				  console.log("Received data:", response);
			  
				  if (response.message && response.message.role === "assistant" && response.message.content) {
					const data = JSON.parse(response.message.content);
			  
					if (data.description && data.modified_html && data.xslt_transform) {
					  setMessages((prevMessages) => [
						...prevMessages,
						{ role: "assistant", content: data.description },
					  ]);
			  
					  try {
						// Convert the modified_html array to an HTML string
						const htmlString = convertModifiedHtmlToString(data.modified_html);
						console.log("Converted HTML string:", htmlString);
			  
						// Apply XSLT transformation
						const transformedHTML = await applyXMLTransformation(htmlString, data.xslt_transform);
						console.log("Transformed HTML:", transformedHTML);
			  
						// Instead of replacing the entire body, update only the relevant parts
						const tempDiv = document.createElement("div");
						tempDiv.innerHTML = transformedHTML;
			  
						// Update user-info section
						const userInfo = document.querySelector(".user-info");
						const newUserInfo = tempDiv.querySelector(".user-info");
						if (userInfo && newUserInfo) {
						  userInfo.innerHTML = newUserInfo.innerHTML;
						}
			  
						// Update main-content section
						const mainContent = document.querySelector(".main-content");
						const newMainContent = tempDiv.querySelector(".main-content");
						if (mainContent && newMainContent) {
						  mainContent.innerHTML = newMainContent.innerHTML;
						}
					  } catch (error) {
						console.error("Error processing HTML:", error);
					  }
					} else {
					  console.error("Received data in unexpected format:", data);
					}
				  } else if (response.modified_html_content || response.xslt) {
					console.log("Received modified HTML content or XSLT, but not processing it.");
				  }
			  
				  setIsTyping(false);
				} catch (error) {
				  console.error("Error parsing WebSocket message:", error);
				}
			  };
			  
			wsRef.current.onerror = (error) => {
				console.error("WebSocket error:", error);
			};

			getEmail().then((email) => {
				setEmail(email || "");
			});

			return () => {
				if (wsRef.current) {
					wsRef.current.close();
				}
			};
		}, []);

		const sendReply = useCallback(
			(messageBody: { messages: Message[] }) => {
				setIsTyping(true);
				if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
					const payload = JSON.stringify({ ...messageBody, domData, email });
					console.log(`sending payload: ${payload}`);
					wsRef.current.send(payload);
				} else {
					console.error("WebSocket is not open");
					setIsTyping(false);
				}
			},
			[email, domData],
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
					<Button variant={Variant.secondary} onClick={close}>
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
