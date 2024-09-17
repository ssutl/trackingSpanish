console.log("SS.UTL inject.js");

let totalWatchedTime = 0; // in seconds
let watching = false;
let timerInterval = null;
let lastSentTime = 0;
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

// Check video is spanish
async function checkVideoIsSpanish() {
  console.log("SS.UTL hostname", window.location.hostname);
  console.log("SS.UTL pathname", window.location.pathname);
  console.log("SS.UTL href", window.location.href);
  if (
    window.location.hostname !== "www.youtube.com" ||
    window.location.pathname !== "/watch"
  ) {
    return;
  }

  const video = document.querySelector("video");
  console.log("ss.utl video", video);

  if (video) {
    console.log("ss.utl video exists");
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

  video.addEventListener("play", startTimer);
  video.addEventListener("pause", stopTimer);
  video.addEventListener("ended", stopTimer);
}

// Initial attachment if video is already present

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "TAB_UPDATED") {
    attachListenersToYouTubePlayer();
    checkVideoIsSpanish();
  }
  return false;
});

chrome.storage.onChanged.addListener(function (res) {
  checkVideoIsSpanish();

  const video = document.querySelector("video");

  // Check if the video is already playing when page loads
  if (!video.paused && !video.ended) {
    console.log("SS.UTL video is already playing, starting timer");
    startTimer(); // Start the timer immediately if the video is playing
  }
});

// OnLoad
attachListenersToYouTubePlayer();
checkVideoIsSpanish();
