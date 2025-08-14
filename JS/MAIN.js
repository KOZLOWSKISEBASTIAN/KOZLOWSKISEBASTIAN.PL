[
  "JS/HEXAGON.js",
  "JS/MOTYWAUTO.js",
  "JS/ODSYLACZE.js"
].forEach(src => {
  const script = document.createElement("script");
  script.src = src;
  script.defer = true;
  document.head.appendChild(script);
});