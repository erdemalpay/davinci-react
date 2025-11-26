import debounce from "lodash/debounce"; // Make sure to install lodash.debounce
import { useRef, useState } from "react";
import { IoMdStar, IoMdStarOutline } from "react-icons/io";

type Props = {
  numberOfStars: number;
  onChange: (newRating: number) => void;
};

const StarRating = ({ numberOfStars, onChange }: Props) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const totalStars = 10;

  const debounceHover = useRef(
    debounce((index: number | null) => {
      setHoverRating(index);
    }, 50)
  ).current;

  const handleMouseEnter = (index: number) => {
    debounceHover(index);
  };

  const handleMouseLeave = () => {
    debounceHover(null);
  };

  const handleClick = (index: number) => {
    onChange(index);
  };

  const stars = [];
  for (let i = 1; i <= totalStars; i++) {
    if (i <= (hoverRating !== null ? hoverRating : numberOfStars)) {
      stars.push(
        <IoMdStar
          key={`star-full-${i}`}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(i)}
          className="cursor-pointer text-yellow-700 text-xl"
        />
      );
    } else {
      stars.push(
        <IoMdStarOutline
          key={`star-outline-${i}`}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(i)}
          className="cursor-pointer text-yellow-700 text-xl"
        />
      );
    }
  }

  return <div className="flex flex-row gap-1">{stars}</div>;
};

export default StarRating;
