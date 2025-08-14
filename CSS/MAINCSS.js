[
  "https://kozlowskisebastian.pl/CSS/KOLORY.css",
  "https://kozlowskisebastian.pl/CSS/HEXAGON.css",
  "https://kozlowskisebastian.pl/CSS/PRZYBORNIK.css"
].forEach(href => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
});
