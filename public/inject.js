(function () {
  if (window.hasRun) return;
  window.hasRun = true;

  function getTotalMinutes(durationText) {
    const timeParts = durationText.split(":").map(Number); // Split by colon and convert each part to a number

    let totalMinutes = 0;

    if (timeParts.length === 3) {
      // Format is hh:mm:ss
      totalMinutes = timeParts[0] * 60 + timeParts[1] + timeParts[2] / 60;
    } else if (timeParts.length === 2) {
      // Format is mm:ss
      totalMinutes = timeParts[0] + timeParts[1] / 60;
    }

    return Math.ceil(totalMinutes); // Return total minutes, rounded up
  }

  function observeVideoChanges() {
    const targetNode = document.querySelector("ytd-item-section-renderer"); // Adjust to the container of the video list

    const config = { childList: true, subtree: true };

    const callback = (mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          injectButton(); // Re-inject buttons when new videos are loaded
        }
      }
    };

    const observer = new MutationObserver(callback);
    if (targetNode) {
      observer.observe(targetNode, config);
    }
  }

  // Call this function after page load or initial button injection
  observeVideoChanges();

  function injectButton() {
    // Check if on the history page
    // Check if on the history page
    const isHistoryPage = window.location.href.includes(
      "youtube.com/feed/history"
    );

    if (isHistoryPage) {
      const buttonOnSite = document.querySelectorAll("#metadata"); // Select all metadata elements

      buttonOnSite.forEach((element, index) => {
        // Ensure button is not already injected into this element
        if (!element.querySelector("#injectedButton-" + index)) {
          // Create container div to hold the "+" and image
          const containerDiv = document.createElement("div");
          containerDiv.id = "injectedButton-" + index; // Assign unique ID
          containerDiv.style.display = "inline-flex";
          containerDiv.style.alignItems = "center";
          containerDiv.style.cursor = "pointer";

          containerDiv.addEventListener("mouseover", () => {
            containerDiv.style.opacity = "0.7";
          });

          containerDiv.addEventListener("mouseout", () => {
            containerDiv.style.opacity = "1";
          });

          // Create "+" span
          const plusSpan = document.createElement("span");
          plusSpan.textContent = "+";
          plusSpan.style.color = "#ffa726";
          plusSpan.style.padding = "5px";
          plusSpan.style.fontSize = "18px";
          plusSpan.style.fontWeight = "bold";
          plusSpan.style.marginRight = "4px";

          // Create the image element
          const img = document.createElement("img");
          img.src = chrome.runtime.getURL("images/icon32.png");
          img.style.width = "20px";
          img.style.height = "20px";
          img.style.marginRight = "12px";

          // Append "+" and image to the container
          containerDiv.appendChild(plusSpan);
          containerDiv.appendChild(img);

          // Add click event listener to the container div
          containerDiv.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            const durationElement = element
              .closest("ytd-video-renderer")
              ?.querySelector(
                "ytd-thumbnail-overlay-time-status-renderer span"
              );

            const videoDuration = durationElement
              ? getTotalMinutes(durationElement.innerText.trim())
              : null;

            if (videoDuration) {
              chrome.runtime.sendMessage({
                type: "ADD_MINUTES",
                duration: videoDuration,
              });
            }
          });

          // Insert the container div at the start of the element
          element.prepend(containerDiv);
        }
      });
    } else {
      // Remove all injected buttons when not on the history page
      const injectedButtons = document.querySelectorAll(
        '[id^="injectedButton-"]'
      );
      injectedButtons.forEach((element) => element.remove());
    }
  }

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
      injectButton(); // Try to inject button on URL change
    }
  }

  // Listen to messages from background
  chrome.runtime.onMessage.addListener(onMessage);

  // listen when local storage is updated
  chrome.storage.onChanged.addListener((res) => {
    if (res["user"]) {
      attachListeners();
      checkIfVideoIsSpanish();
      injectButton(); // Try to inject button on URL change
    }
  });
})();
