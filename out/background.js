console.log("Background script loaded");
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child,
  set,
} from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBU94yh1GICwAQbH6Sk1RvuJPrqlT4E2tA",
  databaseURL:
    "https://trackingspanish-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const OFFSCREEN_DOCUMENT_PATH = "/offscreen.html";

let creating; // Global promise to avoid concurrency issues

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
async function getAuth() {
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

// Firebase authentication process
async function firebaseAuth() {
  try {
    await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

    const auth = await getAuth();

    // Persist user data in chrome.storage.local
    await chrome.storage.local.set({ user: auth.user });

    await saveUserToDatabase(auth.user);
    // Notify success
    return auth;
  } catch (error) {
    console.error("Authentication error:", error.message);
    throw error;
  } finally {
    await closeOffscreenDocument();
  }
}

async function firebaseSignOut() {
  try {
    await chrome.storage.local.remove("user");
    return true;
  } catch (error) {
    console.error("Sign out error:", error.message);
    throw error;
  }
}

// Handle messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.message === "sign_in") {
      firebaseAuth().then((auth) => {
        if (auth) {
          console.log("User signed in:", auth.user);
          sendResponse({ success: true, type: "sign_in" });
        }
      });
    } else if (request.message === "sign_out") {
      firebaseSignOut().then(() => {
        console.log("User signed out");
        sendResponse({ success: true, type: "sign_out" });
      });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }

  // Indicate that the response is asynchronous
  return true;
});

// Check if a user exists in the database
async function userExists(userId) {
  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, `Users/${userId}`));
  return snapshot.exists();
}

// Save user to Firebase Realtime Database
async function saveUserToDatabase(user) {
  const userId = user.uid;
  if (!(await userExists(userId))) {
    await set(ref(database, `Users/${userId}`), {
      name: user.displayName || null,
      total_minutes: 0,
      total_minutes_today: 0,
      total_minutes_synced_with_ds: 0,
    });
    console.log(`User ${userId} saved to database.`);
  } else {
    console.log(`User ${userId} already exists in database.`);
  }
}

// Configure side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("SidePanel error:", error));
