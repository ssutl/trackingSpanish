(function () {
  console.log("SS.UTL inject.js");

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.greeting == "hello") sendResponse({ message: "hi" });
  });

  // Comparing to a literal value to prevent matching a DOM element with id="hasRun"
  // https://stackoverflow.com/q/3434278/do-dom-tree-elements-with-ids-become-global
  if (window.hasRun === true) return;
  window.hasRun = true;

  let totalWatchedTime = 0; // in seconds
  let watching = false;
  let timerInterval = null;
  let lastSentTime = 0;
  let isCurrentVideoSpanish = false;

  // Start timer
  function startTimer() {
    console.log("SS.UTL startTimer is called");
    if (!watching) {
      watching = true;
      timerInterval = setInterval(() => {
        totalWatchedTime++;

        if (totalWatchedTime - lastSentTime >= 60) {
          // Before sending the message, check if video is in Spanish
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
    console.log("SS.UTL stopTimer is called");
    if (watching) {
      watching = false;
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Check video is spanish
  async function checkVideoIsSpanish() {
    if (
      window.location.hostname !== "www.youtube.com" ||
      window.location.pathname !== "/watch"
    ) {
      return;
    }

    const video = document.querySelector("video");

    if (video) {
      // If the page URL has changed and it's a YouTube watch URL
      // Extract video ID from URL
      const videoId = new URLSearchParams(window.location.search).get("v");

      // Fetch user from local storage and check if video is Spanish

      const res = await chrome.runtime.sendMessage({
        type: "FETCH_VIDEO_DETAILS",
        videoId,
      });

      if (!res.success) {
        console.log("SS.UTL error fetching video details", res.error);
        return;
      }

      const videoDetails = res.videoDetails;

      if (videoDetails) {
        console.log("ss.utl videoDetails", videoDetails);
        const res = await chrome.runtime.sendMessage({
          type: "isVideoSpanish",
          videoDetails,
        });
        isCurrentVideoSpanish = res.isSpanish;
        console.log("SS.UTL isCurrentVideoSpanish", isCurrentVideoSpanish);
      }
    }
  }

  // Attach listeners to video player
  function attachListenersToYouTubePlayer() {
    const video = document.querySelector("video");

    if (!video) {
      return;
    }

    console.log("SS.UTL attaching listeners to video player");

    // Remove existing listeners
    video.removeEventListener("play", startTimer);
    video.removeEventListener("pause", stopTimer);
    video.removeEventListener("ended", stopTimer);

    video.addEventListener("play", startTimer);
    video.addEventListener("pause", stopTimer);
    video.addEventListener("ended", stopTimer);
  }

  // Initial attachment if video is already present

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.type === "TAB_UPDATED") {
      console.log("SS.UTL tab updated");
      attachListenersToYouTubePlayer();
      checkVideoIsSpanish();
    }

    chrome.storage.local.get(["user"], function (res) {
      if (res["user"]) {
        const video = document.querySelector("video");
        if (video && !video.paused && !video.ended) {
          startTimer();
        }
      }
    });

    return false;
  });

  chrome.storage.onChanged.addListener(function (res) {
    attachListenersToYouTubePlayer();
    checkVideoIsSpanish();

    if (res["user"]) {
      console.log("SS.UTL user updated", res["user"]);
      const video = document.querySelector("video");
      if (video && !video.paused && !video.ended) {
        startTimer();
      }
    }
  });

  // OnLoad
  attachListenersToYouTubePlayer();
  checkVideoIsSpanish();
})();
