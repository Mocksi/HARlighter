import {
	type MouseEvent,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { MOCKSI_POPUP_LOCATION } from "../../consts";

function Draggable({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const [dragging, setDragging] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const initRef = useRef(true);
	const dragElRef = useRef<HTMLDivElement>(null);
	const lastSavedPosition = useRef({ x: 0, y: 0 });

	const persistPosition = useCallback(() => {
		if (position.x !== 0 && position.y !== 0) {
			if (
				lastSavedPosition.current.x !== position.x ||
				lastSavedPosition.current.y !== position.y
			) {
				chrome.storage.local.set({
					[MOCKSI_POPUP_LOCATION]: position,
				});
				lastSavedPosition.current = position;
			}
		}
	}, [position]);

	function bodyOnMouseUpEventHandler() {
		setDragging(false);
	}

	useLayoutEffect(() => {
		if (initRef.current) {
			chrome.storage.local.get([MOCKSI_POPUP_LOCATION], (results) => {
				const storedPosition = results[MOCKSI_POPUP_LOCATION];
				if (storedPosition.x && storedPosition.y) {
					setPosition(storedPosition);
				}
			});
			window.addEventListener("mouseup", bodyOnMouseUpEventHandler);
			initRef.current = false;
		} else {
			if (!dragging) {
				persistPosition();
			}
			if (dragElRef.current?.style) {
				dragElRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
			}
		}
		return () => {
			window.removeEventListener("mouseup", bodyOnMouseUpEventHandler);
			persistPosition();
		};
	}, [bodyOnMouseUpEventHandler, dragging, persistPosition, position]);

	const updatePosition = (event: MouseEvent) => {
		if (dragging) {
			const bounds = dragElRef.current?.getBoundingClientRect();
			const leftBound = bounds?.left ?? 0;
			let x = position.x;
			let y = position.y;
			if (
				Math.abs(position.x + event.movementX) < window.innerWidth - 50 &&
				leftBound + event.movementX < window.innerWidth - 100
			) {
				x = position.x + event.movementX;
			}
			if (
				Math.abs(position.y + event.movementY) < window.innerHeight - 50 &&
				position.y + event.movementY > 0
			) {
				y = position.y + event.movementY;
			}
			setPosition({ x, y });
		}
	};

	function stopDragging(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		setDragging(false);
	}

	return (
		<div
			className={`${className}·mw-ease-in-out`}
			onMouseDown={() => setDragging(true)}
			onMouseLeave={stopDragging}
			onMouseMove={updatePosition}
			onMouseUp={stopDragging}
			ref={dragElRef}
			tabIndex={-1}
		>
			{children}
		</div>
	);
}

export default Draggable;
