import "./App.css";
import useHttp from "./hooks/useHttp";
import { Song, User } from "./types";

const API_URL = import.meta.env.DEV ? "http://localhost:8000" : "";

function App() {
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useHttp<User[]>(`${API_URL}/user`);

  const {
    data: songs,
    isLoading: songsLoading,
    error: songsError,
  } = useHttp<Song[]>(`${API_URL}/song`);

  console.log("songs", songs);
  console.log("users", users);

  return (
    <>
      {(usersLoading || songsLoading) && <p>Loading data...</p>}

      {usersError && <p>Error loading users: {usersError}</p>}
      {songsError && <p>Error loading songs: {songsError}</p>}

      {users && songs && (
        <div>
          <p>
            Loaded {users.length} users and {songs.length} songs
          </p>
        </div>
      )}
    </>
  );
}

export default App;
