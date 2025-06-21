import { Gameplay } from "../../types";
type Props = {
  gameplay: Gameplay;
  editGameplay: (gameplay: Gameplay) => void;
  getGameName: (game: number) => string;
  getDuration: (date: string, start: string, finish?: string) => string;
};

const GameplayCard = ({
  gameplay,
  editGameplay,
  getGameName,
  getDuration,
}: Props) => {
  return (
    <div
      key={gameplay._id || gameplay.startHour}
      className="flex flex-wrap justify-between text-xs cursor-pointer"
      onClick={() => editGameplay(gameplay)}
    >
      <div className="flex w-full gap-1 justify-between">
        <div className="overflow-hidden whitespace-nowrap text-ellipsis text-xs mr-1">
          {getGameName(gameplay.game as number)}
        </div>
        <h1 className="text-xs">({gameplay.playerCount})</h1>
        <div className="flex gap-2">
          {gameplay.mentor?._id !== "dv" ? (
            <div className="bg-gray-300 rounded-full px-2 mr-1 whitespace-nowrap">
              {gameplay.mentor?.name}
            </div>
          ) : (
            <></>
          )}
          <h5 className="text-xs whitespace-nowrap">
            {getDuration(
              gameplay.date,
              gameplay.startHour,
              gameplay?.finishHour
            )}
          </h5>
        </div>
      </div>
    </div>
  );
};

export default GameplayCard;
