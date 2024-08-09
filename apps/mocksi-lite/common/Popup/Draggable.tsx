import React, { MouseEventHandler } from "react";
import { MOCKSI_POPUP_LOCATION } from "../../consts";

const rightOffset = 30;
const leftOffset = 20;
const topOffset = 20;
const bottomOffset = 20;

function Draggable({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const [dragging, setDragging] = React.useState(false);
	const [transform, setTransform] = React.useState({
		x: 0,
		y: 0,
	});

	const initRef = React.useRef(true);
	const dragElRef = React.useRef<HTMLDivElement>(null);
	const prevTransform = React.useRef(transform);

	const persistTransform = React.useCallback(async () => {
		if (
			prevTransform.current.x !== transform.x ||
			prevTransform.current.y !== transform.y
		) {
			// x y transform validated before state is updated
			await chrome.storage.local.set({
				[MOCKSI_POPUP_LOCATION]: transform,
			});
			prevTransform.current = transform;
		}
	}, [transform]);

	const stopDragging = React.useCallback(async () => {
		setDragging(false);
	}, []);

	const getValidTransform = (xMov = 0, yMov = 0, reqBothValid = false) => {
		const bounds = dragElRef?.current?.getBoundingClientRect();

		// default values
		let x = rightOffset;
		let y = topOffset;

		if (bounds) {
			// x bound checks
			const rightBoundCheck =
				bounds.x + xMov < window.innerWidth - rightOffset - bounds.width / 2;
			const leftBoundCheck = bounds.x + xMov > leftOffset;

			// y bound checks
			const bottomBoundCheck =
				bounds.y + yMov < window.innerHeight - bottomOffset - bounds.height;
			const topBoundCheck = bounds.y + yMov > topOffset;

			const xNextValid = rightBoundCheck && leftBoundCheck;
			const yNextValid = bottomBoundCheck && topBoundCheck;

			if (xNextValid && yNextValid) {
				x = transform.x + xMov;
				y = transform.y + yMov;
			}

			if (!reqBothValid) {
				x = xNextValid ? transform.x + xMov : transform.x;
				y = yNextValid ? transform.y + yMov : transform.y;
			}
		}

		return { x, y };
	};

	function debounce<T, A>(fn: T, delay: number): (args?: A) => void {
		let timeout: number;
		return (args?: A) => {
			clearTimeout(timeout);
			timeout = window.setTimeout(() => {
				if (typeof fn === "function") {
					fn(args);
				}
			}, delay);
		};
	}

	const updateTransformOnDrag: React.MouseEventHandler<HTMLDivElement> =
		debounce((event: React.MouseEvent) => {
			if (dragging) {
				const validTransform = getValidTransform(
					event.movementX,
					event.movementY,
				);
				setTransform(validTransform);
			}
		}, 10);

	const initFromStorage = React.useCallback(async () => {
		const results = await chrome.storage.local.get([MOCKSI_POPUP_LOCATION]);
		const storedTransform = results[MOCKSI_POPUP_LOCATION];
		if (storedTransform) {
			prevTransform.current = storedTransform;
			setTransform(storedTransform);
		}
	}, []);

	React.useEffect(() => {
		if (initRef.current) {
			if (dragElRef.current?.style) {
				dragElRef.current.style.opacity = "0";
			}
			initFromStorage();
			window.addEventListener("mouseup", stopDragging);
			window.addEventListener("mouseleave", stopDragging);
			initRef.current = false;
		} else {
			if (!dragging) {
				persistTransform();
			}
			if (dragElRef.current?.style) {
				dragElRef.current.style.opacity = "1";
				dragElRef.current.style.transform = `translate(${transform.x}px, ${transform.y}px)`;
			}
		}
		return () => {
			persistTransform();
			window.removeEventListener("mouseup", stopDragging);
			window.removeEventListener("mouseleave", stopDragging);
		};
	}, [stopDragging, dragging, persistTransform, transform, initFromStorage]);

	return (
		<div
			className={`${className ?? ""}`}
			onMouseDown={() => setDragging(true)}
			onMouseLeave={stopDragging}
			onMouseMove={updateTransformOnDrag}
			onMouseUp={stopDragging}
			ref={dragElRef}
			tabIndex={-1}
		>
			{children}
		</div>
	);
}

export default Draggable;
