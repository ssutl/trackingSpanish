console.log("offscreen.js loaded");

// This URL must point to the public site
const _URL = "https://tracking-spanish-login.vercel.app";
// This URL must point to the public site
const iframe = document.createElement("iframe");
iframe.src = _URL;
document.documentElement.appendChild(iframe);
chrome.runtime.onMessage.addListener(handleChromeMessages);

function handleChromeMessages(message, sender, sendResponse) {
  // Extensions may have an number of other reasons to send messages, so you
  // should filter out any that are not meant for the offscreen document.
  if (message.target !== "offscreen") {
    return false;
  }

  function handleIframeMessage({ data }) {
    try {
      if (data.startsWith("!_{")) {
        // Other parts of the Firebase library send messages using postMessage.
        // You don't care about them in this context, so return early.
        return;
      }
      data = JSON.parse(data);
      self.removeEventListener("message", handleIframeMessage);

      sendResponse(data);
    } catch (e) {
      console.log(`json parse failed - ${e.message}`);
    }
  }

  globalThis.addEventListener("message", handleIframeMessage, false);

  // Initialize the authentication flow in the iframed document. You must set the
  // second argument (targetOrigin) of the message in order for it to be successfully
  // delivered.
  if (message.type === "firebase-auth") {
    iframe.contentWindow.postMessage(
      { type: "firebase-auth", initAuth: true },
      new URL(_URL).origin
    );
  } else if (message.type === "update-minutes") {
    iframe.contentWindow.postMessage(
      { type: "update-minutes", userId: message.data },
      new URL(_URL).origin
    );
  } else if (message.type === "update-daily-goal") {
    iframe.contentWindow.postMessage(
      {
        type: "update-daily-goal",
        userId: message.data.userId,
        dailyGoal: message.data.dailyGoal,
      },
      new URL(_URL).origin
    );
  } else if (message.type === "firebase-signout") {
    iframe.contentWindow.postMessage(
      { type: "firebase-signout" },
      new URL(_URL).origin
    );
  } else if (message.type === "fetch-video-details") {
    iframe.contentWindow.postMessage(
      {
        type: "fetch-video-details",
        videoId: message.data.videoId,
        apiKey: message.data.apiKey,
      },
      new URL(_URL).origin
    );
  } else if (message.type === "firebase-delete-account") {
    iframe.contentWindow.postMessage(
      { type: "firebase-delete-account", userId: message.data.userId },
      new URL(_URL).origin
    );
  } else if (message.type === "add-minutes") {
    iframe.contentWindow.postMessage(
      {
        type: "add-minutes",
        userId: message.data.userId,
        minutes: message.data.minutes,
      },
      new URL(_URL).origin
    );
  }
  return true;
}
