console.log("Message from inject.js");

let totalWatchedTime = 0; // in seconds
let watching = false;
let timerInterval = null;
let lastSentTime = 0;
let currentPageUrl = "";
let isCurrentVideoSpanish = false;

// Fetch YouTube video details
async function fetchVideoDetails(videoId, apiKey) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      console.log("SS.UTL video details", data.items[0].snippet);
      return data.items[0].snippet;
    } else {
      throw new Error("Video not found");
    }
  } catch (error) {
    console.error("Error fetching video details:", error);
    return null;
  }
}

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
function attachListenersToYouTubePlayer() {
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
      chrome.storage.local.get("user", async (result) => {
        const user = result.user;

        if (user && user.apiKey && videoId) {
          const videoDetails = await fetchVideoDetails(videoId, user.apiKey);

          if (videoDetails) {
            const res = await chrome.runtime.sendMessage({
              type: "isVideoSpanish",
              videoDetails,
            });
            isCurrentVideoSpanish = res.isSpanish;
            console.log("SS.UTL isCurrentVideoSpanish", isCurrentVideoSpanish);
          }
        }
      });
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
