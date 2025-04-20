import { useState, ChangeEvent, useCallback } from "react";

export function useInput(
  defaultValue: string,
  validationFn: (value: string) => boolean
) {
  const [enteredValue, setEnteredValue] = useState(defaultValue);
  const [didEdit, setDidEdit] = useState(false);

  const valueIsValid = validationFn(enteredValue);

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setEnteredValue(event.target.value);
    setDidEdit(false);
  }

  function handleInputBlur() {
    setDidEdit(true);
  }

  const setValue = useCallback((value: string) => {
    setEnteredValue(value);
    setDidEdit(false);
  }, []);

  return {
    value: enteredValue,
    handleInputChange,
    handleInputBlur,
    hasError: didEdit && !valueIsValid,
    setValue,
  };
}
