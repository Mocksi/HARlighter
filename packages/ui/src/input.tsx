"use client";

import { ChangeEventHandler } from "react";

interface InputProps {
  value?: string;
  inputLabel?: string;
  className?: string;
  labelClassName?: string;
  onChange?: ChangeEventHandler
}


export const Input = ({ value, inputLabel, labelClassName ,className, onChange }: InputProps) => {
  return (
    <>
      <label className={labelClassName} style={{ display: 'flex', flexDirection: 'column' }}>{inputLabel}
        <input
          className={className}
          value={value}
          onChange={onChange}
        />
      </label>
    </>
  )
}