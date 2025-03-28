module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "bounce-in": "bounceIn 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        bounceIn: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "50%": { transform: "scale(1.05)", opacity: 0.5 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};

// module.exports = {
//   theme: {
//     extend: {
//       animation: {
//         "fade-in": "fadeIn 0.5s ease-in-out",
//         "bounce-in": "bounceIn 0.5s ease-out",
//       },
//       keyframes: {
//         fadeIn: {
//           "0%": { opacity: 0 },
//           "100%": { opacity: 1 },
//         },
//         bounceIn: {
//           "0%": { transform: "scale(0.9)", opacity: 0 },
//           "50%": { transform: "scale(1.05)", opacity: 0.5 },
//           "100%": { transform: "scale(1)", opacity: 1 },
//         },
//       },
//     },
//   },
//   plugins: [],
// };
