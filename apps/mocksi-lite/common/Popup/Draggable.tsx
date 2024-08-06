import React from "react";
import { MOCKSI_POPUP_LOCATION } from "../../consts";

function Draggable({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const [dragging, setDragging] = React.useState(false);
	const [position, setPosition] = React.useState({ x: 0, y: 0 });

	const initRef = React.useRef(true);
	const dragElRef = React.useRef<HTMLDivElement>(null);
	const lastSavedPosition = React.useRef(position);

	function persistPosition() {
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
	}

	function stopDragging() {
		setDragging(false);
	}

	const updatePosition = (event: React.MouseEvent) => {
		if (dragging) {
			const bounds = dragElRef.current?.getBoundingClientRect();
			const leftBound = bounds?.left ?? 0;
			let { x, y } = position;
			// Make sure the popup is partially visible in the viewport when moved
			// towards edges, offset is larger on right side of screen to give room
			// for dragging the popup without hitting the close button
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

	React.useEffect(() => {
		if (initRef.current) {
			chrome.storage.local.get([MOCKSI_POPUP_LOCATION], (results) => {
				const storedPosition = results[MOCKSI_POPUP_LOCATION];
				if (storedPosition) {
					setPosition(storedPosition);
				}
			});
			window.addEventListener("mouseup", stopDragging);
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
			persistPosition();
			window.removeEventListener("mouseup", stopDragging);
		};
	}, [stopDragging, dragging, persistPosition, position]);

	return (
		<div
			className={`${className}·mw-ease-in`}
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
