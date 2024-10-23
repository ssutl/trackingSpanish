(function () {
  if (window.hasRun) return;
  window.hasRun = true;

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

  function injectCustomStyles() {
    const style = document.createElement("style");
    style.innerHTML = `
      #metadata {
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  function injectButton() {
    injectCustomStyles();
    // Check if on the history page
    if (window.location.href.includes("youtube.com/feed/history")) {
      const buttonOnSite = document.querySelectorAll("#metadata"); // Select all elements with the class

      buttonOnSite.forEach((element, index) => {
        //align all text in these divs center
        // Ensure button is not already injected into this element
        if (!element.querySelector("#injectedButton-" + index)) {
          //make metadata div flex column

          // Create container div to hold the "+" and image
          const containerDiv = document.createElement("div");
          containerDiv.id = "injectedButton-" + index; // Assign unique ID to container
          containerDiv.style.display = "inline-flex"; // Align "+" and image horizontally
          containerDiv.style.alignItems = "center"; // Vertically center the contents
          containerDiv.style.cursor = "pointer"; // Make the whole container clickable

          containerDiv.addEventListener("mouseover", function () {
            //Make div opacity 0.5 on hover
            containerDiv.style.opacity = "0.7";
          });

          containerDiv.addEventListener("mouseout", function () {
            containerDiv.style.opacity = "1";
          });

          // Create the "+" span (instead of a button to integrate with the image)
          const plusSpan = document.createElement("span");
          const plusText = document.createTextNode("+");
          plusSpan.appendChild(plusText);
          plusSpan.style.color = "#ffa726"; // Set text color to white
          plusSpan.style.padding = "5px"; // Add some padding
          plusSpan.style.fontSize = "18px"; // Adjust font size
          plusSpan.style.fontWeight = "bold"; // Make the text bold
          plusSpan.style.marginRight = "4px"; // Add some space between the "+" and the image

          // Create the image element
          const img = document.createElement("img");
          img.src = chrome.runtime.getURL("images/icon32.png");
          img.style.width = "20px"; // Adjust the size of the image
          img.style.height = "20px"; // Adjust the size of the image
          img.style.borderRadius = "3px"; // Make the image circular
          img.style.marginRight = "12px"; // Add some space between the "+" and the image

          // Append "+" and image to the container
          containerDiv.appendChild(plusSpan);
          containerDiv.appendChild(img);

          // Add click event listener to the container div (makes both "+" and image clickable)
          containerDiv.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            const durationElement = element
              .closest("ytd-video-renderer")
              ?.querySelector(
                "ytd-thumbnail-overlay-time-status-renderer span"
              );

            // Extract the text content of the duration (if available)
            const videoDuration = durationElement
              ? durationElement.innerText.trim()
              : null;

            if (videoDuration) {
              const roundedDuration = Math.ceil(videoDuration);

              if (isNaN(roundedDuration)) {
                return;
              }
              // Send the duration along with the message
              chrome.runtime.sendMessage({
                type: "ADD_MINUTES",
                duration: roundedDuration,
              });
            }

            console.log(
              "SSUTL Container clicked: " +
                containerDiv.id +
                ", Duration: " +
                videoDuration
            );
          });

          // Insert the container div at the start of the element
          element.prepend(containerDiv);
        }
      });
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
