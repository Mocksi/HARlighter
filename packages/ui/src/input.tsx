"use client";

import { ChangeEventHandler, useState } from "react";

interface InputProps {
  value?: string;
  inputLabel?: string;
  className?: string;
  labelClassName?: string;
  onChange?: ChangeEventHandler
}

export const Input = ({ value, inputLabel, labelClassName ,className, onChange }: InputProps) => {
  const [focused, setFocused] = useState(false)
  return (
    <>
      <label className={labelClassName} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {inputLabel}
        <input
          style={{
            outline: 'none',
            borderRadius: '8px',
            borderWidth: '2px',
            borderColor: focused ? '#009875' : '#ABABAB',
            height: '40px',
            boxShadow: '0px 0px 8px 0px #0000001A'
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={className}
          value={value}
          onChange={onChange}
        />
      </label>
    </>
  )
}