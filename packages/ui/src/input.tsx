"use client";

import { ChangeEventHandler } from "react";

interface InputProps {
  value: string;
  className?: string;
  onChange: ChangeEventHandler
}

export const Input = ({value, className, onChange}: InputProps) => {
  return (
    <input 
      className={className}
      value={value}
      onChange={onChange}
    />
  )
}