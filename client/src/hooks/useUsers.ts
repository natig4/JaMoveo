import { useState, useCallback, useEffect } from "react";
import { httpGetAllUsers } from "./requests";

function useUsers() {
  const [users, saveUsers] = useState([]);

  const getUsers = useCallback(async () => {
    const users = await httpGetAllUsers();
    saveUsers(users);
  }, []);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  return users;
}

export default useUsers;
