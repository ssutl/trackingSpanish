console.log("Background script loaded");

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

chrome.runtime.onInstalled.addListener(async () => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      if (tab.url.match(/(chrome|chrome-extension):\/\//gi)) {
        continue;
      }
      const target = { tabId: tab.id, allFrames: cs.all_frames };
      // First, check if the content script has already been injected
      chrome.scripting.executeScript(
        {
          target,
          func: () => !!window.hasRun, // Returns `true` if the script has already run
        },
        (results) => {
          if (results && results[0]?.result) {
            console.log("Content script already injected, skipping.");
          } else {
            // Inject the script if it hasn't been injected
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
      );
    }
  }
});

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
    console.log("Offscreen document closed");
  }
}

// Function to get Firebase authentication
async function getAuthPopup() {
  try {
    const auth = await chrome.runtime.sendMessage({
      type: "firebase-auth",
      target: "offscreen",
    });
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

async function fetchVideoDetails(videoId, apiKey) {
  try {
    const res = await chrome.runtime.sendMessage({
      type: "fetch-video-details",
      target: "offscreen",
      data: {
        videoId,
        apiKey,
      },
    });
    console.log("res from fetch video details", res);
    return res;
  } catch (error) {
    throw error;
  }
}

// Firebase authentication process
async function firebaseAuth() {
  try {
    await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

    const res = await getAuthPopup();
    const auth = res.result;

    if (!auth.user && auth.error) {
      throw new Error(auth.error.message);
    }
    // Persist user data in chrome.storage.local
    await chrome.storage.local.set({
      user: auth.user,
      accessToken: auth._tokenResponse.oauthAccessToken,
    });

    return auth;
  } catch (error) {
    throw error;
  }
}

// Open offscreen doc for communication
async function openOffscreenDoc() {
  try {
    await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

    return true;
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
    await chrome.storage.local.clear();

    // Close the offscreen document
    await closeOffscreenDocument();
    console.log("Sign-out ACTUALLY CLOSED successful");

    return true;
  } catch (error) {
    console.error("Sign-out error:", error.message);
    throw error;
  }
}

async function firebaseDeleteAccount() {
  try {
    // Retrieve the user data from local storage
    const { user } = await chrome.storage.local.get("user");

    if (!user || !user.uid) {
      console.error("No user found in local storage for deletion");
      return false;
    }

    // Send a message to Firebase (through the offscreen iframe) to delete the account
    await chrome.runtime.sendMessage({
      type: "firebase-delete-account",
      target: "offscreen",
      data: { userId: user.uid },
    });

    // Clear the local storage to remove user-related data
    await chrome.storage.local.clear();

    // Close the offscreen document if it exists
    await closeOffscreenDocument();

    console.log("Account deleted successfully and offscreen document closed.");
    return true;
  } catch (error) {
    console.error("Error deleting account:", error.message);
    throw error;
  }
}

// Handle messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.type === "sign_in") {
      console.log("sign_in request received");
      firebaseAuth()
        .then((auth) => {
          sendResponse({ success: true, type: "sign_in" });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      // Indicate that the response is asynchronous
      return true;
    } else if (request.type === "sign_out") {
      firebaseSignOut()
        .then(() => {
          console.log("sign_out successful");
          sendResponse({ success: true, type: "sign_out" });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      // Indicate that the response is asynchronous
      return true;
    } else if (request.type === "WATCHED_ONE_MINUTE") {
      console.log("WATCHED_ONE_MINUTE being sent to offscreen");
      chrome.storage.local.get(["user"], (result) => {
        console.log("result", result);
        const user = result.user;
        if (user) {
          const userId = user.uid;
          updateMinutes(userId);
        }
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
              console.log("update daily goal", res);
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
    } else if (request.type === "isVideoSpanish") {
      isVideoInSpanish(request.videoDetails).then((res) => {
        console.log("isSpanish", res);
        sendResponse({ success: true, isSpanish: res });
      });
      return true; // Indicates async response
    } else if (request.type === "POPUP_OPENED") {
      openOffscreenDoc().then((res) => {
        sendResponse({ success: true });
      });
    } else if (request.type === "FETCH_VIDEO_DETAILS") {
      console.log("SS.UTL video request recieved");
      chrome.storage.local.get(["user"], (result) => {
        const user = result.user;
        if (user) {
          const userApiKey = user.apiKey;
          fetchVideoDetails(request.videoId, userApiKey)
            .then((res) => {
              console.log("res", res);
              sendResponse({ success: true, videoDetails: res.videoDetails });
            })
            .catch((error) => {
              sendResponse({ success: false, error: error.message });
            });
        } else {
          sendResponse({ success: false, error: "User not found" });
        }
      });
      return true; // Indicates async response
    } else if (request.type === "DELETE_ACCOUNT") {
      firebaseDeleteAccount()
        .then(() => {
          console.log("delete account successful");
          sendResponse({ success: true, type: "delete_account" });
        })
        .catch((error) => {
          console.log("error", error);
          sendResponse({ success: false, error: error.message });
        });

      // Indicate that the response is asynchronous
      return true;
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
});

// Check if video is in Spanish
async function isVideoInSpanish(videoDetails) {
  console.log("videoDetails", videoDetails);
  const lowerCaseVideoTags = videoDetails.tags
    ? videoDetails.tags.map((tag) => tag.toLowerCase())
    : [];

  const lowerCaseComparisonTags = keywords.map((tag) => tag.toLowerCase());

  const doesVideoTagsHaveSpanish = lowerCaseVideoTags.some((tag) =>
    lowerCaseComparisonTags.includes(tag)
  );

  const defaultAudioLanguage = videoDetails.defaultAudioLanguage
    ? videoDetails.defaultAudioLanguage.toLowerCase()
    : "";

  const chromeLanguageTitle = await chrome.i18n.detectLanguage(
    videoDetails.title
  );

  const isTitleInSpanish = chromeLanguageTitle.languages[0].language === "es";
  console.log("isTitleInSpanish", isTitleInSpanish);

  const chromeLanguageDescription = await chrome.i18n.detectLanguage(
    videoDetails.description
  );
  const isDescriptionInSpanish =
    chromeLanguageDescription.languages[0].language === "es";
  console.log("isDescriptionInSpanish", isDescriptionInSpanish);

  const watchingSpanish =
    doesVideoTagsHaveSpanish ||
    isTitleInSpanish ||
    isDescriptionInSpanish ||
    defaultAudioLanguage.includes("es");

  console.log("watchingSpanish", watchingSpanish);

  return watchingSpanish;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    // Wait for a short period to ensure the content script is fully injected
    //check if user is in local storage
    chrome.storage.local.get("user", (result) => {
      const user = result.user;
      console.log("user", user);
      if (user) {
        setTimeout(() => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
              type: "TAB_UPDATED",
            });
          });
        }, 1000);
      }
    });
  }
});

// Configure side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("SidePanel error:", error));
