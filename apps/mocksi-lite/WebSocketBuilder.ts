type WebSocketEventHandler = (event: MessageEvent) => void;
type WebSocketCommand = {
	type: string;
	payload: string;
	url: string;
	method: string;
};

class WebSocketBuilder {
	private url: string;
	private onOpenHandler!: () => void; // definite assignment assertion
	private onMessageHandler!: WebSocketEventHandler; // definite assignment assertion
	private onCloseHandler!: () => void; // definite assignment assertion
	private requestInterceptions: Map<string, WebSocketCommand>;
	private currentTabId: number | null;
	private keepAliveIntervalId: number | undefined;
	private reconnectTimeout: number | null;
	private webSocket!: WebSocket;

	constructor(url: string) {
		this.url = url;
		this.requestInterceptions = new Map();
		this.currentTabId = null;
		this.keepAliveIntervalId = undefined;
		this.reconnectTimeout = null;
	}

	onOpen(handler: () => void): WebSocketBuilder {
		this.onOpenHandler = handler;
		return this;
	}

	private handleOnMessage(event: MessageEvent) {
		let command: WebSocketCommand | null = null;
		try {
			const parsed = JSON.parse(event.data);
			command = parsed as WebSocketCommand;
		} catch (e) {
			console.error("Error parsing websocket message", e);
			return;
		}

		if (command?.type === "RequestInterception") {
			// data will be uri encoded to prevent issues with unicode
			const interceptDataEncoded = atob(command.payload);
			const interceptData = decodeURIComponent(interceptDataEncoded);
			const interception: WebSocketCommand = {
				type: command.type,
				url: command.url,
				method: command.method,
				payload: interceptData,
			};
			this.requestInterceptions.set(command.url, interception);

			if (!this.currentTabId) {
				return;
			}

			chrome.debugger.sendCommand(
				{ tabId: this.currentTabId },
				"Network.setRequestInterception",
				{
					patterns: [
						{
							urlPattern: command.url,
							resourceType: "XHR",
							interceptionStage: "Request",
						},
					],
				},
				(response) => {
					console.log("requested", response);
				},
			);
			chrome.debugger.onEvent.addListener(this.allEventHandler.bind(this));
		}

		if (command?.type === "ChatStart") {
		}
	}

	onMessage(handler: WebSocketEventHandler): WebSocketBuilder {
		this.onMessageHandler = handler;
		return this;
	}

	private handleOnClose() {
		this.scheduleReconnect();
	}

	onClose(handler: () => void): WebSocketBuilder {
		this.onCloseHandler = handler;
		return this;
	}

	private scheduleReconnect() {
		const reconnectInterval = 5000; // 5 seconds
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}
		this.reconnectTimeout = window.setTimeout(() => {
			const newWebSocket = new WebSocketBuilder(this.url)
				.onOpen(this.onOpenHandler)
				.onMessage(this.onMessageHandler)
				.onClose(this.handleOnClose.bind(this))
				.build();
			this.webSocket = newWebSocket;
			this.keepAlive();
		}, reconnectInterval);
	}

	private keepAlive() {
		if (this.keepAliveIntervalId) {
			clearInterval(this.keepAliveIntervalId);
		}
		this.keepAliveIntervalId = window.setInterval(() => {
			if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
				clearInterval(this.keepAliveIntervalId);
				this.scheduleReconnect();
				return;
			}
			try {
				this.webSocket.send("keepalive");
			} catch (e) {
				console.error("Error sending keepalive", e);
				clearInterval(this.keepAliveIntervalId);
				this.scheduleReconnect();
			}
		}, 5 * 1000);
	}

	private allEventHandler() {
		// Your all event handler logic here
	}

	build(): WebSocket {
		this.webSocket = new WebSocket(this.url);

		this.webSocket.onopen = () => {
			this.onOpenHandler();
			this.keepAlive();
		};
		this.webSocket.onmessage = this.handleOnMessage.bind(this);
		this.webSocket.onclose = this.handleOnClose.bind(this);

		return this.webSocket;
	}
}

export default WebSocketBuilder;
