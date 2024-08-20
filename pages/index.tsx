import React, { useEffect } from "react";

export default function Home() {
  const [user, setUser] = React.useState(null);
  //Check if user is already signed in
  useEffect(() => {
    chrome.storage.local.get(["user"], (result) => {
      if (result.user) {
        console.log("User already signed in", result.user);
        setUser(result.user);
      } else {
        console.log("User not signed in");
      }
    });

    // Listen for messages from background.js
  }, []);

  const getUserFromStorage = () => {
    chrome.storage.local.get(["user"], (result) => {
      if (result.user) {
        console.log("User already signed in", result.user);
        setUser(result.user);
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
