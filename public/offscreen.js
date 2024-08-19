    // This URL must point to the public site
    const _URL = 'https://tracking-spanish-login.vercel.app';
    const iframe = document.createElement('iframe');
    iframe.src = _URL;
    iframe.allowFullscreen = true;

    // Style the iframe to make it full-screen
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none'; // Optional: remove border if needed
    iframe.style.zIndex = '9999'; // Optional: bring the iframe to the front
    document.documentElement.appendChild(iframe);
    chrome.runtime.onMessage.addListener(handleChromeMessages);

    function handleChromeMessages(message, sender, sendResponse) {
      // Extensions may have an number of other reasons to send messages, so you
      // should filter out any that are not meant for the offscreen document.
      if (message.target !== 'offscreen') {
        return false;
      }

      function handleIframeMessage({data}) {
        try {
          if (data.startsWith('!_{')) {
            // Other parts of the Firebase library send messages using postMessage.
            // You don't care about them in this context, so return early.
            return;
          }
          data = JSON.parse(data);
          self.removeEventListener('message', handleIframeMessage);

          sendResponse(data);
        } catch (e) {
          console.log(`json parse failed - ${e.message}`);
        }
      }

      globalThis.addEventListener('message', handleIframeMessage, false);

      // Initialize the authentication flow in the iframed document. You must set the
      // second argument (targetOrigin) of the message in order for it to be successfully
      // delivered.
      iframe.contentWindow.postMessage({"initAuth": true}, new URL(_URL).origin);
      return true;
    }
    