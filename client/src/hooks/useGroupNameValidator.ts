import { useState, useCallback } from "react";
import { checkGroupName } from "../services/groups.service";

export function useGroupNameValidator(
  defaultValue: string = "",
  isAdmin: boolean = false,
  isSignIn = false
) {
  const [enteredValue, setEnteredValue] = useState(defaultValue);
  const [didEdit, setDidEdit] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isExists, setIsExists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valueIsValid = isAdmin
    ? enteredValue.trim().length >= 3 && !isExists && !error
    : isSignIn
    ? enteredValue.length === 0 || enteredValue.trim().length >= 3
    : enteredValue.trim().length >= 3;

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setEnteredValue(event.target.value);
      setDidEdit(false);
      setIsExists(false);
      setError(null);
    },
    []
  );

  const handleInputBlur = useCallback(async () => {
    setDidEdit(true);
    if (!isAdmin) {
      return;
    }

    if (enteredValue.trim().length >= 3) {
      try {
        setIsChecking(true);
        const exists = await checkGroupName(enteredValue);
        setIsExists(exists);

        if (exists) {
          setError("Group name already exists");
        }
      } catch (err) {
        setError("Failed to check group name");
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    }
  }, [enteredValue, isAdmin]);

  const setValue = useCallback((value: string) => {
    setEnteredValue(value);
    setDidEdit(false);
    setIsExists(false);
    setError(null);
  }, []);

  return {
    value: enteredValue,
    handleInputChange,
    handleInputBlur,
    hasError: didEdit && !valueIsValid,
    isChecking,
    isExists,
    error,
    valueIsValid,
    setValue,
  };
}
