const API_URL = "http://localhost:8000";

export async function httpGetAllSongs() {
  const songs = await fetch(`${API_URL}/song`);
  return await songs.json();
}

export async function httpGetAllUsers() {
  const songs = await fetch(`${API_URL}/user`);
  return await songs.json();
}
