const tabAudioContexts = {};
const tabVolumes = {};

function captureTabAudio(tabId, volume) {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.capture(
      {
        audio: true,
        video: false,
      },
      (stream) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
          return;
        }

        const audioContext = new AudioContext();
        const gainNode = audioContext.createGain();
        const sourceNode = audioContext.createMediaStreamSource(stream);

        sourceNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        tabAudioContexts[tabId] = { audioContext, gainNode, sourceNode, stream };
        gainNode.gain.value = volume;
        tabVolumes[tabId] = volume;
        resolve();
      }
    );
  });
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setVolume') {
    const tabId = request.tabId;
    const volume = request.volume;

    if (!tabAudioContexts[tabId]) {
      captureTabAudio(tabId, volume)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          alert(error);
          sendResponse({ success: false, error });
        });
    } else {
      tabAudioContexts[tabId].gainNode.gain.value = volume;
      tabVolumes[tabId] = volume;
      sendResponse({ success: true });
    }

    return true; // Indica que la respuesta se enviará de forma asíncrona.
  }

  if (request.action === 'getVolume') {
    const tabId = request.tabId;
    const volume = tabVolumes[tabId] || 1; // Devolver el valor del volumen o 1 por defecto
    sendResponse({ volume });
  }
});



chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabAudioContexts[tabId]) {
    tabAudioContexts[tabId].audioContext.close();
    tabAudioContexts[tabId].stream.getAudioTracks()[0].stop();
    delete tabAudioContexts[tabId];
  }
});
