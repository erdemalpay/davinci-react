import React from "react";

const keys = [
  ["7", "8", "9", "Tüm"],
  ["4", "5", "6", "1/n"],
  ["1", "2", "3", "indirim"],
  [".", "0", "←"],
];

const Keypad: React.FC = () => {
  const handleKeyPress = (key: string) => {
    console.log("Key pressed:", key);
  };

  return (
    <div className="p-4 grid grid-cols-4 gap-2">
      {keys.flat().map((key, index) => (
        <button
          key={index}
          className="bg-gray-100 p-3 rounded-lg focus:outline-none  hover:bg-gray-200"
          onClick={() => handleKeyPress(key)}
        >
          {key}
        </button>
      ))}
    </div>
  );
};

export default Keypad;
