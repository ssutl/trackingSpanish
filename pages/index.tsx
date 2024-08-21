import React, { useEffect } from "react";
import axios from "axios";

export default function Home() {
  const [user, setUser] = React.useState<GoogleUser>(null);
  //Check if user is already signed in

  const isTokenValid = async (user: GoogleUser) => {
    if (!user.stsTokenManager) {
      return false;
    }

    const currentTime = new Date().getTime();
    console.log("currentTime", currentTime);
    const valid = currentTime < user.stsTokenManager.expirationTime;

    if (!valid) {
      const res = await refreshToken();
      if (res) {
        console.log("Token refreshed");
        return true;
      } else {
        console.log("Token not refreshed");
        return false;
      }
    } else {
      console.log(
        `Token is still valid it expires at ${user.stsTokenManager.expirationTime}`
      );
      return true;
    }
  };

  async function refreshToken() {
    const url = `https://securetoken.googleapis.com/v1/token?key=${user.apiKey}`;
    const payload = {
      grant_type: "refresh_token",
      refresh_token: user.stsTokenManager.refreshToken,
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = response.data;
      console.log("Token refreshed", data);

      // Update the stored tokens in the Chrome extension with new ones.
      const userCopy = { ...user };
      userCopy.stsTokenManager.accessToken = data.access_token;
      userCopy.stsTokenManager.expirationTime =
        new Date().getTime() + data.expires_in * 1000;
      chrome.storage.local.set({ user: userCopy });

      return true;
    } catch (error) {
      console.error("Error refreshing token", error);
      return false;
    }
  }

  useEffect(() => {
    getUserFromStorage();
  }, []);

  const getUserFromStorage = () => {
    chrome.storage.local.get(["user"], (result) => {
      const user = result.user as GoogleUser;
      if (user) {
        setUser(user);
        isTokenValid(user);
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
