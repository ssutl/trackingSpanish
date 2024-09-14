console.log("Message from inject.js");
//Fromhere I can fuck with the whole UI in the future if i want

let totalWatchedTime = 0; // in seconds
let watching = false;
let timerInterval = null;
let lastSentTime = 0;
let currentVideoSrc = "";

function startTimer() {
  if (!watching) {
    watching = true;
    timerInterval = setInterval(() => {
      totalWatchedTime++;
      if (totalWatchedTime - lastSentTime >= 60) {
        // Check if one minute has passed
        lastSentTime = totalWatchedTime;
        chrome.runtime.sendMessage({ type: "WATCHED_ONE_MINUTE" });
      }
    }, 1000); // Increase time every second
  }
}

function stopTimer() {
  if (watching) {
    watching = false;
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function attachListenersToYouTubePlayer() {
  const video = document.querySelector("video");

  if (video) {
    // Check if it's a new video by comparing the src attribute
    if (video.src !== currentVideoSrc) {
      currentVideoSrc = video.src; // Update the current video src
      console.log("New video detected:", currentVideoSrc);
    }

    video.addEventListener("play", startTimer);
    video.addEventListener("pause", stopTimer);
    video.addEventListener("ended", stopTimer);
  }
}

// Listen for DOM changes to detect the video element
const observer = new MutationObserver(attachListenersToYouTubePlayer);
observer.observe(document.body, { childList: true, subtree: true });

// Initial attachment if video is already present
attachListenersToYouTubePlayer();
