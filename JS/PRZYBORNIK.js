        const kontener = document.querySelector('.KOZLOWSKISEBASTIAN_HEXAGON_KONTENER');
        const ksztalt = document.querySelector('.KOZLOWSKISEBASTIAN_HEXAGON_KSZTALT');
        const trojkatKontener = document.querySelector('.KOZLOWSKISEBASTIAN_TROJKAT_KONTENER');
        const trojkaty = document.querySelectorAll('.KOZLOWSKISEBASTIAN_TROJKAT');
        const body = document.body;

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        let clickStartTime = 0;
        const CLICK_MAX_DURATION = 150;
        const CLICK_MAX_DISTANCE = 8;

        ksztalt.addEventListener('mousedown', startInteraction);
        ksztalt.addEventListener('touchstart', startInteraction);

        function startInteraction(e) {
            clickStartTime = Date.now();
            isDragging = false;
            
            const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
            
            startX = clientX;
            startY = clientY;
            
            const rect = kontener.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('touchmove', handleMove);
            document.addEventListener('mouseup', endInteraction);
            document.addEventListener('touchend', endInteraction);
        }

        function handleMove(e) {
            const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
            
            const dx = clientX - startX;
            const dy = clientY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (!isDragging && distance > CLICK_MAX_DISTANCE) {
                isDragging = true;
            }
            
            if (isDragging) {
                const newX = initialLeft + dx;
                const newY = initialTop + dy;
                
                const maxX = window.innerWidth - kontener.offsetWidth;
                const maxY = window.innerHeight - kontener.offsetHeight;
                
                kontener.style.left = `${Math.min(Math.max(0, newX), maxX)}px`;
                kontener.style.top = `${Math.min(Math.max(0, newY), maxY)}px`;
            }
        }

        function endInteraction(e) {
            const clickDuration = Date.now() - clickStartTime;
            const isClick = !isDragging && clickDuration < CLICK_MAX_DURATION;
            
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', endInteraction);
            document.removeEventListener('touchend', endInteraction);
            
            if (isClick) {
                handleClick();
            }
            
            isDragging = false;
        }

        function handleClick() {
            if (!ksztalt.classList.contains('ROZSZERZONY')) {
                ksztalt.classList.add('OBRACAJ');
                
                setTimeout(() => {
                    ksztalt.classList.remove('OBRACAJ');
                    ksztalt.classList.add('ROZSZERZONY');
                }, 300);
            }
        }

        trojkaty.forEach(trojkat => {
            trojkat.addEventListener('click', function(e) {
                ksztalt.classList.remove('ROZSZERZONY');
                
                body.classList.remove('KOZLOWSKISEBASTIAN_CIEMNY', 'KOZLOWSKISEBASTIAN_JASNY');

                if (this.classList.contains('KOZLOWSKISEBASTIAN_TROJKAT_JEDEN')) {
                    body.classList.add('KOZLOWSKISEBASTIAN_CIEMNY');
                } else if (this.classList.contains('KOZLOWSKISEBASTIAN_TROJKAT_DWA')) {
                    body.classList.add('KOZLOWSKISEBASTIAN_JASNY');
                }

                e.stopPropagation();
            });
        });

        document.addEventListener('click', function(e) {
            if (ksztalt.classList.contains('ROZSZERZONY') && !kontener.contains(e.target)) {
                ksztalt.classList.remove('ROZSZERZONY');
            }
        });

        document.querySelectorAll('.KOZLOWSKISEBASTIAN_PRZYBORNIK-PRZYCISK').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const polish = {'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ź':'Z','Ż':'Z','ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'};
                const path = btn.innerText.toUpperCase().replace(/[ĄĆĘŁŃÓŚŹŻąćęłńóśźż]/g, m => polish[m]).replace(/ /g, '-');
                if (btn.innerText.trim() !== '') {
                    location.href = `https://kozlowskisebastian.pl/${path}/`;
                }
            });
        });

        function initHexagonPosition() {
            if (window.innerWidth <= 768) {
                kontener.style.left = '20px';
                kontener.style.top = 'auto';
                kontener.style.bottom = '20px';
                kontener.style.right = 'auto';
            }
        }

        window.addEventListener('load', initHexagonPosition);
        window.addEventListener('resize', initHexagonPosition);
