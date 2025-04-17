import { ChangeEvent } from "react";
import Input from "./Input/Input";

const instrumentOptions = [
  { value: "", label: "Select your instrument", disabled: true },
  { value: "guitar", label: "Guitar" },
  { value: "piano", label: "Piano" },
  { value: "drums", label: "Drums" },
  { value: "bass", label: "Bass" },
  { value: "saxophone", label: "Saxophone" },
  { value: "vocals", label: "Vocals" },
  { value: "other", label: "Other" },
];

interface InstrumentSelectProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  onBlur?: () => void;
  hasError?: boolean;
  errorText?: string;
  required?: boolean;
  label?: string;
  className?: string;
}

function InstrumentSelect({
  value,
  onChange,
  onBlur,
  hasError = false,
  errorText = "Please select an instrument",
  required = false,
  label = "Your instrument",
  className,
}: InstrumentSelectProps) {
  return (
    <Input
      id='instrument'
      label={label}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      options={instrumentOptions}
      required={required}
      hasError={hasError}
      errorText={errorText}
      className={className}
    />
  );
}

export default InstrumentSelect;
