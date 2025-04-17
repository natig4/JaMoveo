import { Song } from "../../model/types";

export default function MusicPlayer({
  song,
  instrument,
}: {
  song: Song;
  instrument?: string;
}) {
  console.log("song", song);
  console.log("song", instrument);

  return (
    <>
      <p>this is my player</p>
    </>
  );
}
