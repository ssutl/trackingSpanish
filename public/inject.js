(function () {
  if (window.hasRun) return;
  window.hasRun = true;

  let totalWatchedTime = 0; // in seconds
  let timerInterval = null;
  let lastSentTime = 0;
  let isCurrentVideoSpanish = false;

  // Unique orphan message ID
  const orphanMessageId = chrome.runtime.id + "orphanCheck";

  // Dispatch event to detect orphaned state
  window.dispatchEvent(new Event(orphanMessageId));

  // Attach orphan check listener
  window.addEventListener(orphanMessageId, unregisterOrphan);

  // Start timer
  function startTimer() {
    if (!timerInterval) {
      timerInterval = setInterval(() => {
        totalWatchedTime++;

        // Every 60 seconds, send a message if video is in Spanish
        if (totalWatchedTime - lastSentTime >= 60) {
          lastSentTime = totalWatchedTime;

          if (isCurrentVideoSpanish) {
            chrome.runtime.sendMessage({ type: "WATCHED_ONE_MINUTE" });
          }
        }
      }, 1000); // Increase time every second
    }
  }

  // Stop timer
  function stopTimer() {
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
      // Attach listeners if not already attached
      video.addEventListener("play", startTimer);
      video.addEventListener("pause", stopTimer);
      video.addEventListener("ended", stopTimer);

      // Set flag to indicate listeners are attached
      video.dataset.listenersAttached = "true";
    }

    // Check if video is currently playing and start timer if it is
    if (video && !video.paused) {
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

  // Unregister listeners and clean up when orphaned
  function unregisterOrphan() {
    if (chrome.runtime.id) {
      // We're not orphaned
      return;
    }

    // Remove event listeners
    window.removeEventListener(orphanMessageId, unregisterOrphan);
    const video = document.querySelector("video");
    if (video) {
      video.removeEventListener("play", startTimer);
      video.removeEventListener("pause", stopTimer);
      video.removeEventListener("ended", stopTimer);
    }

    // Stop the timer if running
    stopTimer();

    // Unregister message listeners
    try {
      chrome.runtime.onMessage.removeListener(onMessage);
    } catch (e) {}

    return true;
  }

  // Message listener function
  function onMessage(request, sender, sendResponse) {
    if (request.type === "TAB_UPDATED") {
      attachListeners();
      checkIfVideoIsSpanish();
    }
  }

  // Listen to messages from background
  chrome.runtime.onMessage.addListener(onMessage);

  // listen when local storage is updated
  chrome.storage.onChanged.addListener((res) => {
    if (res["user"]) {
      attachListeners();
      checkIfVideoIsSpanish();
    }
  });
})();
