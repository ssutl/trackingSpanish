console.log("Message from inject.js");

let totalWatchedTime = 0; // in seconds
let watching = false;
let timerInterval = null;
let lastSentTime = 0;
let currentPageUrl = "";
let isCurrentVideoSpanish = false;

// Start timer
function startTimer() {
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
  if (watching) {
    watching = false;
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Attach listeners to video player
async function attachListenersToYouTubePlayer() {
  const video = document.querySelector("video");

  if (video) {
    // If the page URL has changed and it's a YouTube watch URL
    if (
      window.location.href !== currentPageUrl &&
      window.location.href.includes("/watch")
    ) {
      currentPageUrl = window.location.href; // Update the current page URL

      // Extract video ID from URL
      const videoId = new URLSearchParams(window.location.search).get("v");

      // Fetch user from local storage and check if video is Spanish

      const res = await chrome.runtime.sendMessage({
        type: "FETCH_VIDEO_DETAILS",
        videoId,
      });

      const videoDetails = res.videoDetails;

      if (videoDetails) {
        const res = await chrome.runtime.sendMessage({
          type: "isVideoSpanish",
          videoDetails,
        });
        isCurrentVideoSpanish = res.isSpanish;
        console.log("SS.UTL isCurrentVideoSpanish", isCurrentVideoSpanish);
      }
    }

    video.addEventListener("play", startTimer);
    video.addEventListener("pause", stopTimer);
    video.addEventListener("ended", stopTimer);
  }
}

// Mutation observer to detect changes in the DOM and attach listeners to the YouTube player
const observer = new MutationObserver(attachListenersToYouTubePlayer);
observer.observe(document.body, { childList: true, subtree: true });

// Initial attachment if video is already present
attachListenersToYouTubePlayer();

const startUpCheck = async () => {
  if (window.location.href.includes("/watch")) {
    currentPageUrl = window.location.href; // Update the current page URL

    // Extract video ID from URL
    const videoId = new URLSearchParams(window.location.search).get("v");

    // Fetch user from local storage and check if video is Spanish

    const res = await chrome.runtime.sendMessage({
      type: "FETCH_VIDEO_DETAILS",
      videoId,
    });

    const videoDetails = res.videoDetails;

    if (videoDetails) {
      const res = await chrome.runtime.sendMessage({
        type: "isVideoSpanish",
        videoDetails,
      });
      isCurrentVideoSpanish = res.isSpanish;
      console.log("SS.UTL isCurrentVideoSpanish", isCurrentVideoSpanish);
    }
  }
};

chrome.storage.onChanged.addListener(function () {
  startUpCheck();
  console.log("SS.UTL storage changed");
});
