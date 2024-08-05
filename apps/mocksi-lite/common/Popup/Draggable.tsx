import { type MouseEventHandler, useEffect, useRef, useState } from "react";
import React from "react";

function Draggable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current?.style) {
      ref.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, [position]);

  const onMouseMove: MouseEventHandler<HTMLButtonElement | HTMLDivElement> = (
    event,
  ) => {
    if (pressed) {
      setPosition({
        x: position.x + event.movementX,
        y: position.y + event.movementY,
      });
    }
  };

  return (
    <div
      className={className}
      draggable
      onDragExit={(e) => console.log(e)}
      onMouseDown={() => setPressed(true)}
      onMouseEnter={() => setPressed(false)}
      onMouseMove={onMouseMove}
      onMouseUp={() => setPressed(false)}
      ref={ref}
    >
      {children}
    </div>
  );
}

export default Draggable;
