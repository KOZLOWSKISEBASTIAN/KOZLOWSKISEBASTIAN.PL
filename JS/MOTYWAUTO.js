(function(){
  const ROOT = document.documentElement;
  const KLUCZ_MOTYW = 'MOTYW';

  function isMobile(){
    const uaMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const touch = navigator.maxTouchPoints > 0;
    const narrow = window.innerWidth <= 812;
    return uaMobile || (touch && narrow);
  }

  function setMotywTryb(tryb){
    ROOT.setAttribute('WYBOR_MOTYW', tryb);
    localStorage.setItem(KLUCZ_MOTYW, tryb);
  }

  if (isMobile()) {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 20) {
      setMotywTryb('JASNY');
    } else {
      setMotywTryb('CIEMNY');
    }
  } else {
    setMotywTryb('CIEMNY');
  }
})();