"use client";

import { type HTMLInputTypeAttribute, useState, forwardRef, type ForwardedRef, type BaseSyntheticEvent } from "react";

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
  showErrorMessage?: boolean;
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
  showErrorMessage = true,
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
          onChange={onChange}
          className={inputClassName}
          value={value || ""}
          type={inputType}
          ref={ref}
        />
      </label>
      {(errorMessage && showErrorMessage) && <span style={{marginLeft: '8px', fontSize: '14px', color: '#B8293D'}}>{errorMessage}</span>}
    </>
  )
})