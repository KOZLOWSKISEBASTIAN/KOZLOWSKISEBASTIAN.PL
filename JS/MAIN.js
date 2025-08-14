[
  "https://kozlowskisebastian.pl/JS/HEXAGON.js",
  "https://kozlowskisebastian.pl/JS/MOTYWAUTO.js",
  "https://kozlowskisebastian.pl/JS/ODSYLACZE.js"
].forEach(src => {
  const script = document.createElement("script");
  script.src = src;
  script.defer = true;
  document.head.appendChild(script);
});
