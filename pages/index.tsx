import React, { useEffect } from "react";

export default function Home() {
  const [user, setUser] = React.useState<GoogleUser>(null);
  const [watchingSpanish, setWatchingSpanish] = React.useState<boolean>(false);

  useEffect(() => {
    getUserFromStorage();

    chrome.runtime.sendMessage({ message: "POPUP_OPENED" });

    chrome.windows.getCurrent((window) => {
      const windowId = window.id;
      const storageKey = `watchingSpanish-${windowId}`;

      // Listen for changes to the specific storage key
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && changes[storageKey]) {
          const newValue = changes[storageKey].newValue;
          console.log(`Storage key ${storageKey} changed to ${newValue}`);
          setWatchingSpanish(newValue);
        }
      });

      // Get the initial value from storage
      chrome.storage.local.get([storageKey], (result) => {
        const initialWatchingSpanish = result[storageKey];
        if (initialWatchingSpanish !== undefined) {
          setWatchingSpanish(initialWatchingSpanish);
        }
      });
    });
  }, []);

  const getUserFromStorage = () => {
    chrome.storage.local.get(["user"], (result) => {
      const user = result.user as GoogleUser;
      if (user) {
        setUser(user);
      } else {
        console.log("User not signed in");
      }
    });
  };

  const handleSignIn = async () => {
    // send message to background.js
    const res = await chrome.runtime.sendMessage({ message: "sign_in" });
    if (res.success) {
      getUserFromStorage();
    }
  };

  const handleSignOut = async () => {
    // send message to background.js
    const res = await chrome.runtime.sendMessage({ message: "sign_out" });

    if (res.success) {
      setUser(null);
    }
  };

  return (
    <div className="h-screen w-full bg-green-200">
      {user ? (
        <div>
          <h1>Welcome {user.displayName}</h1>
          <h2>Watching Spanish: {watchingSpanish ? "Yes" : "No"}</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault();
            handleSignIn();
          }}
        >
          Sign InLOOOL
        </button>
      )}
    </div>
  );
}
