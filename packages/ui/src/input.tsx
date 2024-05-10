"use client";

import { HTMLInputTypeAttribute, useState, forwardRef, ForwardedRef, BaseSyntheticEvent } from "react";

interface InputProps {
  id?: string,
  value?: string | number | null | undefined;
  inputLabel?: string;
  inputClassName?: string;
  labelClassName?: string;
  onChange?: (valueChanged: BaseSyntheticEvent<InputEvent>) => void;
  onFocus? : () => void
  onBlur? : () => void
  errorMessage?: string;
  inputType?: HTMLInputTypeAttribute;
}

export const Input = forwardRef(({ 
  id,
  value,
  inputLabel,
  labelClassName,
  inputClassName,
  onChange,
  errorMessage,
  inputType,
}: InputProps, ref: ForwardedRef<any>) => {
  const [focused, setFocused] = useState(false)
  return (
    <>
      <label className={labelClassName} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {inputLabel}
        <input
          id={id}
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
          value={value || ""}
          onChange={onChange ? (event) => onChange(event) : () => {}}
          type={inputType}
          ref={ref}
        />
      </label>
      {errorMessage && <span style={{marginLeft: '8px', fontSize: '14px', color: '#B8293D'}}>{errorMessage}</span>}
    </>
  )
})