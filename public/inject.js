(function () {
  if (window.hasRun) return;
  window.hasRun = true;
  console.log("SS.UTL injected");

  let totalWatchedTime = 0; // in seconds
  let timerInterval = null;
  let lastSentTime = 0;
  let isCurrentVideoSpanish = false;

  // Start timer
  function startTimer() {
    console.log("SS.UTL starting timer");
    if (!timerInterval) {
      timerInterval = setInterval(() => {
        totalWatchedTime++;

        // Every 60 seconds, send a message if video is in Spanish
        if (totalWatchedTime - lastSentTime >= 60) {
          lastSentTime = totalWatchedTime;
          console.log("SS.UTL minute passed");

          if (isCurrentVideoSpanish) {
            console.log("SS.UTL sending message to background to add minute");
            chrome.runtime.sendMessage({ type: "WATCHED_ONE_MINUTE" });
          }
        }
      }, 1000); // Increase time every second
    }
  }

  // Stop timer
  function stopTimer() {
    console.log("SS.UTL stopping timer");
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Attach listeners to video player
  function attachListeners() {
    const video = document.querySelector("video");

    if (
      !video.dataset.listenersAttached &&
      video &&
      window.location.href.includes("youtube.com/watch")
    ) {
      console.log("SS.UTL listeners attached");
      // Attach listeners if not already attached
      video.addEventListener("play", startTimer);
      video.addEventListener("pause", stopTimer);
      video.addEventListener("ended", stopTimer);

      // Set flag to indicate listeners are attached
      video.dataset.listenersAttached = "true";
    } else {
      console.log("SS.UTL listeners already attached");
    }

    // Check if video is currently playing and start timer if it is
    if (video && !video.paused) {
      console.log("SS.UTL video is currently playing, starting timer");
      startTimer();
    }
  }

  // Check if video is in Spanish
  async function checkIfVideoIsSpanish() {
    if (!window.location.href.includes("youtube.com/watch")) return;
    // Get video id from url v=?
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("v");

    // Get video details send message to background
    const res = await chrome.runtime.sendMessage({
      type: "FETCH_VIDEO_DETAILS",
      videoId,
    });

    console.log("SS.UTL video details", res);

    const videoDetails = res.videoDetails;

    if (videoDetails) {
      const response = await chrome.runtime.sendMessage({
        type: "isVideoSpanish",
        videoDetails,
      });
      const isSpanish = response.isSpanish;
      console.log("SS.UTL isSpanish", isSpanish);
      isCurrentVideoSpanish = isSpanish;
    }
  }

  // Listen to messages from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "TAB_UPDATED") {
      console.log("SS.UTL tab updated");
      // When tab is updated, attach listeners to video player
      attachListeners();
      checkIfVideoIsSpanish();
    }
  });

  // listen when local storage is updated
  chrome.storage.onChanged.addListener((res) => {
    if (res["user"]) {
      console.log("SS.UTL state updated in local storage");
      attachListeners();
      checkIfVideoIsSpanish();
    }
  });
})();
