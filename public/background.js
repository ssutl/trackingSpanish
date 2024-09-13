console.log("Background script loaded");

import { franc, francAll } from "https://cdn.jsdelivr.net/npm/franc@6.2.0/+esm";

// Re-insert content scripts on extension reload
chrome.runtime.onInstalled.addListener(async () => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      if (tab.url.match(/(chrome|chrome-extension):\/\//gi)) {
        continue;
      }
      const target = { tabId: tab.id, allFrames: cs.all_frames };
      if (cs.js && cs.js.length > 0) {
        chrome.scripting.executeScript({
          files: cs.js,
          injectImmediately: cs.run_at === "document_start",
          world: cs.world, // requires Chrome 111+
          target,
        });
      }
      if (cs.css && cs.css.length > 0) {
        chrome.scripting.insertCSS({
          files: cs.css,
          origin: cs.origin,
          target,
        });
      }
    }
  }
});

const OFFSCREEN_DOCUMENT_PATH = "/offscreen.html";

let creating; // Global promise to avoid concurrency issues

const keywords = [
  "spanish",
  "Spanish vlog",
  "Spanish food",
  "Spanish cuisine",
  "learning Spanish",
  "Spanish vocabulary",
  "Spanish culture",
  "Spanish language practice",
  "spanish teacher",
  "vlog in spanish",
  "vlog in spain",
  "spanish supermarket",
  "how to learn spanish",
  "basic spanish phrases",
  "learning spanish",
  "study spanish vlog",
  "spanish vlog",
  "barcelona vlog",
  "spanish",
  "speaking spanish for 24 hours",
  "learning Spanish",
  "study Spanish",
  "learn Spanish",
  "España",
  "Español",
  "Estudiar",
];

// Helper function to check if an offscreen document is already active
async function hasDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some(
    (c) => c.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
  );
}

// Set up an offscreen document if it doesn't exist
async function setupOffscreenDocument(path) {
  if (!(await hasDocument())) {
    if (creating) {
      await creating;
    } else {
      creating = chrome.offscreen.createDocument({
        url: path,
        reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
        justification: "authentication",
      });
      await creating;
      creating = null;
    }
  }
}

// Close the offscreen document if it exists
async function closeOffscreenDocument() {
  if (await hasDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

// Function to get Firebase authentication
async function getAuthPopup() {
  try {
    const auth = await chrome.runtime.sendMessage({
      type: "firebase-auth",
      target: "offscreen",
    });
    if (auth?.name === "FirebaseError") {
      throw new Error(auth.message || "Firebase authentication error");
    }
    return auth;
  } catch (error) {
    throw error;
  }
}

// Function to update minutes in offscreen
async function updateMinutes(userId) {
  try {
    const res = await chrome.runtime.sendMessage({
      type: "update-minutes",
      target: "offscreen",
      data: userId,
    });
    console.log("res from update minutes", res);
  } catch (error) {
    console.error("Error updating minutes:", error);
    throw error;
  }
}

// Function to update daily goal in offscreen
async function updateDailyGoal(userId, dailyGoal) {
  try {
    const res = await chrome.runtime.sendMessage({
      type: "update-daily-goal",
      target: "offscreen",
      data: { userId, dailyGoal },
    });
    console.log("res from daily goal", res);
    return res;
  } catch (error) {
    console.error("Error updating daily goal:", error);
    throw error;
  }
}

// Firebase authentication process
async function firebaseAuth() {
  try {
    await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

    const res = await getAuthPopup();
    const auth = res.result;
    console.log("auth", auth);

    // Persist user data in chrome.storage.local
    await chrome.storage.local.set({
      user: auth.user,
      accessToken: auth._tokenResponse.oauthAccessToken,
    });

    return auth;
  } catch (error) {
    console.error("Authentication error:", error.message);
    throw error;
  }
}

async function firebaseSignOut() {
  try {
    await chrome.runtime.sendMessage({
      type: "firebase-signout",
      target: "offscreen",
    });

    // Optionally, you can remove any locally stored data
    await chrome.storage.local.remove("user");

    // Close the offscreen document
    await closeOffscreenDocument();

    return true;
  } catch (error) {
    console.error("Sign-out error:", error.message);
    throw error;
  }
}

// Handle messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.message === "sign_in") {
      firebaseAuth().then((auth) => {
        sendResponse({ success: true, type: "sign_in" });
      });
      // Indicate that the response is asynchronous
      return true;
    } else if (request.message === "sign_out") {
      firebaseSignOut().then(() => {
        sendResponse({ success: true, type: "sign_out" });
      });
      // Indicate that the response is asynchronous
      return true;
    } else if (request.type === "WATCHED_ONE_MINUTE") {
      // Handle watched one minute
      // Not async since we don't need to wait for the promise to resolve
      chrome.windows.getCurrent((window) => {
        const windowId = window.id;
        const storageKey = `watchingSpanish-${windowId}`;
        chrome.storage.local.get(["user", storageKey], (result) => {
          const user = result.user;
          const watchingSpanish = result[storageKey];
          if (user && watchingSpanish) {
            const userId = user.uid;
            updateMinutes(userId);
          }
        });
      });
      return false;
    } else if (request.type === "UPDATE_DAILY_GOAL") {
      // Is async since we need to wait for the promise to resolve
      chrome.storage.local.get("user", (result) => {
        const user = result.user;
        if (user) {
          const userId = user.uid;
          updateDailyGoal(userId, request.dailyGoal)
            .then((res) => {
              console.log("res", res);
              sendResponse({ success: true });
            })
            .catch((error) => {
              console.error("Error updating daily goal:", error);
              sendResponse({ success: false });
            });
        } else {
          sendResponse({ success: false });
        }
      });
      return true; // Indicates async response
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
});

// Check if a user exists in the database

// Save user to Firebase Realtime Database

// Get youtube video details
async function fetchVideoDetails(user, videoId) {
  const apiKey = user.apiKey; // Replace with your YouTube API key
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet;
    } else {
      throw new Error("Video not found");
    }
  } catch (error) {
    console.error("Error fetching video details:", error);
    return null;
  }
}

// Function to check if the current tab is a YouTube video
function checkYouTubeVideo(tabId) {
  chrome.storage.local.get("user", (result) => {
    const user = result.user;
    if (user && user.apiKey) {
      chrome.tabs.get(tabId, (tab) => {
        try {
          const url = new URL(tab.url);
          if (url.hostname === "www.youtube.com" && url.pathname === "/watch") {
            const videoId = url.searchParams.get("v");
            if (videoId) {
              fetchVideoDetails(user, videoId)
                .then((videoDetails) => {
                  console.log("videoDetails", videoDetails);
                  // If video default language is Spanish, set local storage "watching_spanish" to true

                  const lowerCaseTags = videoDetails.tags
                    ? videoDetails.tags.map((tag) => tag.toLowerCase())
                    : [];

                  const isWatchingSpanish = lowerCaseTags.some((tag) =>
                    keywords.map((word) => word.toLowerCase()).includes(tag)
                  );

                  const defaultAudioLanguage = videoDetails.defaultAudioLanguage
                    ? videoDetails.defaultAudioLanguage.toLowerCase()
                    : "";

                  const titleLanguage = francAll(videoDetails.title, {
                    only: ["spa"],
                  })[0][0];
                  console.log("titleLanguage", titleLanguage);
                  const isTitleInSpanish = titleLanguage === "spa";

                  //check description
                  const descriptionLanguage = francAll(
                    videoDetails.description,
                    { only: ["spa"] }
                  )[0][0];
                  console.log("descriptionLanguage", descriptionLanguage);
                  const isDescriptionInSpanish = descriptionLanguage === "spa";

                  const watchingSpanish =
                    defaultAudioLanguage.includes("es") ||
                    isWatchingSpanish ||
                    isTitleInSpanish ||
                    isDescriptionInSpanish;

                  // Get the current window ID
                  chrome.windows.getCurrent((window) => {
                    const windowId = window.id;
                    const storageKey = `watchingSpanish-${windowId}`;

                    // Store the state in local storage with the window ID
                    chrome.storage.local.set({
                      [storageKey]: watchingSpanish,
                    });
                  });
                })
                .catch((error) => {
                  console.error("Error fetching video details:", error);
                });
            }
          } else {
            // Get the current window ID
            chrome.windows.getCurrent((window) => {
              const windowId = window.id;
              const storageKey = `watchingSpanish-${windowId}`;

              // Store the state in local storage with the window ID
              chrome.storage.local.set({
                [storageKey]: false,
              });
            });
          }
        } catch (error) {
          chrome.windows.getCurrent((window) => {
            const windowId = window.id;
            const storageKey = `watchingSpanish-${windowId}`;

            // Store the state in local storage with the window ID
            chrome.storage.local.set({
              [storageKey]: false,
            });
          });
        }
      });
    }
  });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    checkYouTubeVideo(tabId);
  }
  //Not async since we don't need to wait for the promise to resolve
  return false;
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  checkYouTubeVideo(activeInfo.tabId);
  //Not async since we don't need to wait for the promise to resolve
  return false;
});

// Listen for extension installation or startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      checkYouTubeVideo(tabs[0].id);
    }
  });
  //Not async since we don't need to wait for the promise to resolve
  return false;
});

chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      checkYouTubeVideo(tabs[0].id);
    }
  });
  //Not async since we don't need to wait for the promise to resolve
  return false;
});

// Listen for popup opening
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "POPUP_OPENED") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        checkYouTubeVideo(tabs[0].id);
      }
    });
  }
  //Not async since we don't need to wait for the promise to resolve
  return false;
});

// Listen for changes in local storage (e.g., user sign-in)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.user) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        checkYouTubeVideo(tabs[0].id);
      }
    });
  }
  //Not async since we don't need to wait for the promise to resolve
  return false;
});

// Configure side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("SidePanel error:", error));
