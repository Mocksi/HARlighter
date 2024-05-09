"use client";

import { ChangeEventHandler, HTMLInputTypeAttribute, useState } from "react";

interface InputProps {
  value?: string;
  inputLabel?: string;
  inputClassName?: string;
  labelClassName?: string;
  onChange?: (valueChanged: string) => void;
  errorMessage?: string;
  inputType?: HTMLInputTypeAttribute
}

export const Input = ({ value, inputLabel, labelClassName, inputClassName, onChange, errorMessage, inputType }: InputProps) => {
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
            borderStyle: 'solid',
            borderColor: errorMessage ? '#B8293D' : (focused ? '#009875' : '#ABABAB'),
            height: '40px',
            boxShadow: '0px 0px 8px 0px #0000001A',
            padding: '0 8px'
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={inputClassName}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : () => {}}
          type={inputType}
        />
      </label>
      {errorMessage && <span style={{color: '#B8293D'}}>{errorMessage}</span>}
    </>
  )
}