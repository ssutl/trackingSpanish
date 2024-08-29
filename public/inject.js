console.log("Message from inject.js");
//Fromhere I can fuck with the whole UI in the future if i want

let totalWatchedTime = 0; // in seconds
let watching = false;
let timerInterval = null;
let lastSentTime = 0;

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
