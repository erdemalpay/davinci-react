type Props = {};

const Loading = (props: Props) => {
  return (
    <div className="fixed inset-0 w-full h-full z-50">
      -
      <div className="absolute inset-0 w-full h-full z-50 opacity-50 bg-black text-white">
        <div className="flex justify-center w-full h-full items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <h1 className="text-2xl">Loading...</h1>
        </div>
      </div>
    </div>
  );
};

export default Loading;
