import React, { useEffect } from "react";

export default function Home() {
  const [user, setUser] = React.useState<GoogleUser>(null);
  const [watchingSpanish, setWatchingSpanish] = React.useState<boolean>(false);

  useEffect(() => {
    getUserFromStorage();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("message", message);
      if (message.watchingSpanish !== undefined) {
        if (message.watchingSpanish) {
          console.log("You are watching a Spanish video.");
          // Perform any actions needed when watching a Spanish video
          setWatchingSpanish(true);
        } else {
          console.log("You are not watching a Spanish video.");
          // Perform any actions needed when not watching a Spanish video
          setWatchingSpanish(false);
        }
      }
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
    <div>
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
