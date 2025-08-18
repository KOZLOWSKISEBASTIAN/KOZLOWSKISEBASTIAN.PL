(function(){
  'use strict';
  var EKRAN = document.getElementById('EKRAN');
  var klawisze = document.getElementById('klawisze');
  var LOGBox  = document.getElementById('LOG');

  var first = null;
  var operator = null;
  var waitingSecond = false;
  var value = '0';
  var MAX_LEN = 18;

  var lastEquation = null;
  var showFinal = false;

  var lastOps = [];

  function pushOpLine(line){
    lastOps.push(line);
    while(lastOps.length > 2) lastOps.shift();
  }

  function commitIfNeeded(){
    if (showFinal && lastEquation){
      pushOpLine(lastEquation);
      lastEquation = null;
      showFinal = false;
    }
  }

  function renderLOG(){
    var lines = lastOps.slice(-2);
    var html = '';
    for (var i=0;i<lines.length;i++){
      html += '<div class="KALKULATOR_LOG_LINIA">' + escapeHtml(lines[i]) + '</div>';
    }
    LOGBox.innerHTML = html;
  }

  function buildDisplayText(){
    if (showFinal && lastEquation) return lastEquation;
    if (operator){
      if (waitingSecond){
        return formatNumber(first) + ' ' + (sym[operator]||operator);
      } else {
        var cur = parseFloat(value);
        return formatNumber(first) + ' ' + (sym[operator]||operator) + ' ' + formatNumber(cur);
      }
    }
    return format(value);
  }

  function aktualizuj(){ EKRAN.textContent = buildDisplayText(); renderLOG(); }

  function format(txt){
    var s = String(txt).replace('.', ',');
    return s.length > MAX_LEN ? s.slice(0, MAX_LEN) : s;
  }

  function formatNumber(n){
    if (!isFinite(n)) return 'NaN';
    return String(n).replace('.', ',');
  }

  var sym = { '*':'×', '/':'÷', '+':'+', '-':'−', '%':'%' };

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(m){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m];
    });
  }

  function inputDigit(d){
    if (showFinal){
      commitIfNeeded();
      first = null; operator = null; waitingSecond = false; value = d;
    } else if (waitingSecond){
      value = d; waitingSecond = false;
    } else {
      value = (value === '0') ? d : (value + d);
    }
  }
  function inputDot(){
    if (showFinal){
      commitIfNeeded(); first = null; operator = null; waitingSecond = false; value = '0.'; return;
    }
    if (waitingSecond){ value = '0.'; waitingSecond = false; return; }
    if (value.indexOf('.') === -1) value += '.';
  }
  function toggleSign(){
    if (showFinal){ commitIfNeeded(); }
    if (value === '0') return;
    value = value.charAt(0) === '-' ? value.slice(1) : ('-' + value);
  }
  function clearAll(){
    lastEquation = null; showFinal = false;
    first = null; operator = null; waitingSecond = false; value = '0';
    lastOps.length = 0;
  }
  function backspace(){
    if (showFinal){ commitIfNeeded(); }
    if (!waitingSecond) value = (value.length > 1 ? value.slice(0, -1) : '0');
  }

  function setOperator(op){
    if (showFinal){
      commitIfNeeded();
      first = parseFloat(value);
      operator = op;
      waitingSecond = true;
      aktualizuj();
      return;
    }

    var cur = parseFloat(value);
    if (operator && waitingSecond){ operator = op; return; }

    if (first === null){
      first = cur;
    } else if (operator){
      first = oblicz(first, cur, operator);
      value = String(first);
    }

    operator = op; waitingSecond = true; aktualizuj();
  }

  function eq(){
    if (operator === null) return;
    var cur = parseFloat(value);
    var wynik = oblicz(first, cur, operator);
    value = String(wynik);
    lastEquation = formatNumber(first) + ' ' + (sym[operator]||operator) + ' ' + formatNumber(cur) + ' = ' + formatNumber(wynik);
    showFinal = true;
    first = null; operator = null; waitingSecond = false;
  }

  function oblicz(a, b, op){
    if (!isFinite(a) || !isFinite(b)) return NaN;
    switch(op){
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
      case '%': return a % b;
      default:  return b;
    }
  }

  klawisze.addEventListener('click', function(e){
    var btn = e.target.closest('button'); if (!btn) return;
    if (btn.dataset.cyfra){ inputDigit(btn.dataset.cyfra); }
    else if (btn.dataset.oper){ setOperator(btn.dataset.oper); }
    else {
      var akcja = btn.dataset.akcja;
      if (akcja === 'dot') inputDot();
      else if (akcja === 'clear') clearAll();
      else if (akcja === 'back') backspace();
      else if (akcja === 'sign') toggleSign();
      else if (akcja === 'eq') eq();
    }
    aktualizuj();
  });

  document.addEventListener('keydown', function(e){
    var k = e.key;
    if (/^[0-9]$/.test(k)) { inputDigit(k); }
    else if (k === ',' || k === '.') { inputDot(); }
    else if (k === 'Backspace') { backspace(); }
    else if (k === 'Escape') { clearAll(); }
    else if (k === 'Enter' || k === '=') { eq(); }
    else if (['+', '-', '*', '/','%'].indexOf(k) !== -1) { setOperator(k); }
    else { return; }
    e.preventDefault(); aktualizuj();
  }, { passive:false });

  aktualizuj();
})();
