console.log('Background script loaded');

const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

let creating; // Global promise to avoid concurrency issues

// Helper function to check if an offscreen document is already active
async function hasDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some((c) => c.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH));
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
        justification: 'authentication',
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
      type: 'firebase-auth',
      target: 'offscreen',
    });
    if (auth?.name === 'FirebaseError') {
      throw new Error(auth.message || 'Firebase authentication error');
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
    // Notify success
    return auth;
  } catch (error) {
    console.error('Authentication error:', error.message);
    throw error;
  } finally {
    await closeOffscreenDocument();
  }
}

async function firebaseSignOut() {
  try{
    await chrome.storage.local.remove('user');
    return true;
  }catch(error){
    console.error('Sign out error:', error.message);
    throw error;
  }
}

// Handle messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.message === 'sign_in') {
      firebaseAuth().then((auth) => {
        if (auth) {
            console.log('User signed in:', auth.user);
            sendResponse({ success: true, type: 'sign_in'});
        }
      });
     
    } else if (request.message === 'sign_out') {
      firebaseSignOut().then(() => {
        console.log('User signed out');
        sendResponse({ success: true, type: 'sign_out'});
      });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }

  // Indicate that the response is asynchronous
  return true;
});

// Listen to messages to fetch youtube video data
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  if (request.message === 'fetch_video_data') {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = request.video_url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;

    if (!videoId) {
      sendResponse({ success: false, error: "Invalid YouTube video URL" });
      return true;
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${request.apiKey}`;

      fetch(url)
        .then((response) => response.json())  // Convert response to JSON
        .then((data) => {
          sendResponse({ success: true, data: data });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
    

    // Indicate that the response is asynchronous
    return true;
  }
});

// Configure side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('SidePanel error:', error));