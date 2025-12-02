const plugin = require("tailwindcss/plugin");
const withMT = require("@material-tailwind/react/utils/withMT");

/** @type {import('tailwindcss').Config} */

module.exports = withMT({
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
      },
      fontFamily: {
        sans: [
          "__Plus_Jakarta_Sans_a182b8",
          "__Plus_Jakarta_Sans_Fallback_a182b8",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
    namedGroups: ["tooltip"],
  },
  plugins: [
    plugin(
      function ({ addUtilities, theme, e }) {
        const values = theme("colCount");

        var utilities = Object.entries(values).map(([key, value]) => {
          return {
            [`.${e(`col-count-${key}`)}`]: { columnCount: `${value}` },
          };
        });

        addUtilities(utilities);
      },
      {
        theme: {
          colCount: {
            2: "2",
            3: "3",
            4: "4",
            5: "5",
            6: "6",
          },
        },
      }
    ),
    require("tailwindcss-named-groups"),
  ],
});
