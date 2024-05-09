"use client";

import { ReactNode, useState } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  onClick: () => any
}

export const Button = ({ children, className, onClick }: ButtonProps) => {
  const [hover, setHover] = useState(false)
  return (
    <button
      className={className}
      style={{
        background: hover ? '#006C52' : '#00513D',
        borderColor: '#00513D',
        borderWidth: '1px',
        borderRadius: '99px',
        color: 'white',
        height: '42px',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
