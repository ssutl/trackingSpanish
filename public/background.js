    console.log('Background script loaded');
    
    const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

    // A global promise to avoid concurrency issues
    let creatingOffscreenDocument;

    // Chrome only allows for a single offscreenDocument. This is a helper function
    // that returns a boolean indicating if a document is already active.
    async function hasDocument() {
      // Check all windows controlled by the service worker to see if one
      // of them is the offscreen document with the given path
      const matchedClients = await clients.matchAll();
      return matchedClients.some(
        (c) => c.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
      );
    }

    async function setupOffscreenDocument(path) {
      // If we do not have a document, we are already setup and can skip
      if (!(await hasDocument())) {
        // Create offscreen document
        if (creatingOffscreenDocument) {
          await creatingOffscreenDocument;
        } else {
          creatingOffscreenDocument = chrome.offscreen.createDocument({
            url: path,
            reasons: [
                chrome.offscreen.Reason.DOM_SCRAPING
            ],
            justification: 'authentication'
          });
          await creatingOffscreenDocument;
          creatingOffscreenDocument = null;
        }
      }
    }

    async function closeOffscreenDocument() {
      if (!(await hasDocument())) {
        return;
      }
      await chrome.offscreen.closeDocument();
    }

    function getAuth() {
      return new Promise(async (resolve, reject) => {
        try {
          const auth = await chrome.runtime.sendMessage({
            type: 'firebase-auth',
            target: 'offscreen'
          });
          if (auth && auth.name !== 'FirebaseError') {
            resolve(auth);
          } else {
            reject(auth);
          }
        } catch (error) {
          reject(error);
        }
      });
    }

    async function firebaseAuth() {
      await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

      let auth;
      try {
        auth = await getAuth();
        console.log('User Authenticated', auth);
      } catch (err) {
        if (err.code === 'auth/operation-not-allowed') {
          console.error('You must enable an OAuth provider in the Firebase console in order to use signInWithPopup. This sample uses Google by default.');
        } else {
          console.error(err);
        }
      } finally {
        await closeOffscreenDocument();
      }

      return auth;
    }
    
    chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
    