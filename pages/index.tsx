import React, { useEffect } from "react";

export default function Home() {
  const [user, setUser] = React.useState<GoogleUser>(null);

  useEffect(() => {
    getUserFromStorage();
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

  const handleFetchVideoData = async () => {
    // send message to background.js
    const res = await chrome.runtime.sendMessage({
      message: "fetch_video_data",
      video_url: "https://www.youtube.com/watch?v=h5ywteO5Mjc",
      apiKey: user.apiKey,
    });

    if (res.success) {
      console.log("Video data fetched", res.data);
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
          <button
            onClick={(e) => {
              e.preventDefault();
              handleFetchVideoData();
            }}
          >
            Fetch Video Data
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
