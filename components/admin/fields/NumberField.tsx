"use client";

import TextField, { TextFieldProps } from "./TextField";

export default function NumberField(
  props: Omit<TextFieldProps, "type">
) {
  return (
    <TextField
      type="number"
      inputMode="numeric"
      {...props}
    />
  );
}