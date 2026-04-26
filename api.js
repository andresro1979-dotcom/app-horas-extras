var GAS_URL = 'https://script.google.com/macros/s/AKfycbxZKVTC6AgKID-dkz77jaF_w_q5BWnaStFhvPoN8noTmHBRq6C8oGaPlhRJakFLn512/exec';

function gasCall(accion, datos) {
  return new Promise(function(resolve) {
    var cbName = '_cb' + Date.now() + Math.floor(Math.random() * 1000000);
    var url = GAS_URL + '?callback=' + cbName + '&accion=' + encodeURIComponent(accion);
    if (datos) url += '&datos=' + encodeURIComponent(JSON.stringify(datos));

    var timer = setTimeout(function() {
      cleanup();
      resolve({ ok: false, error: 'timeout' });
    }, 20000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      var s = document.getElementById(cbName);
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }

    window[cbName] = function(res) {
      cleanup();
      resolve(res);
    };

    var script = document.createElement('script');
    script.id = cbName;
    script.onerror = function() {
      cleanup();
      resolve({ ok: false, error: 'red' });
    };
    script.src = url;
    document.body.appendChild(script);
  });
}
