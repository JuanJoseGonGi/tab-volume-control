document.getElementById('volume').addEventListener('input', (event) => {
  const volume = event.target.value;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;

    chrome.runtime.sendMessage({ action: 'setVolume', tabId: tabId, volume: parseFloat(volume) }, (response) => {
      if (!response || !response.success) {
        document.getElementById('error-message').style.display = 'block';
      } else {
        document.getElementById('error-message').style.display = 'none';
      }
    });
  });
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabId = tabs[0].id;

  // Solicitar el valor del volumen para la pestaña actual
  chrome.runtime.sendMessage({ action: 'getVolume', tabId: tabId }, (response) => {
    if (response && response.volume) {
      document.getElementById('volume').value = response.volume;
    }
  });
});
