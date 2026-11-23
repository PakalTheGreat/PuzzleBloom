/** CWG deep green / graphite — light-first professional theme. */
const green = "#1B5E45";
const greenDeep = "#0F3D2E";
const graphite = "#14181F";
const muted = "#5A6578";

export default {
  light: {
    text: graphite,
    background: "#F4F6F8",
    tint: green,
    tabIconDefault: "#8A93A3",
    tabIconSelected: green,
    brand: greenDeep,
    muted,
  },
  dark: {
    text: "#F4F6F8",
    background: graphite,
    tint: "#3D9B74",
    tabIconDefault: "#5A6578",
    tabIconSelected: "#3D9B74",
    brand: "#3D9B74",
    muted: "#8A93A3",
  },
};
