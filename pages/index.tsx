import React, { useEffect } from "react";
import { FiChrome } from "react-icons/fi";

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

  const Navbar = () => (
    <div className="w-full flex justify-center items-center px-10 h-16 border-b border-white border-opacity-5 text-white">
      <h1 className="text-xl font-medium">Tracking Spanish</h1>
    </div>
  );

  const Footer = () =>
    user && (
      <div className="w-full flex text-white border-t px-10 h-16 border-white border-opacity-5 ">
        <h1>es it need something Do</h1>
      </div>
    );

  const Body = () => {
    return (
      <div className="flex-grow w-full px-10">
        {user ? (
          <button
            onClick={handleSignOut}
            className="bg-secondary px-4 py-2 rounded-md w-full border border-white border-opacity-5 text-white flex justify-center"
          >
            Sign out
          </button>
        ) : (
          <>
            <h1 className="text-xl font-medium text-white">
              Continue your journey to Spanish fluency
            </h1>
            <button
              onClick={handleSignIn}
              className="bg-secondary px-4 py-2 rounded-md w-full border border-white border-opacity-5 text-white flex justify-center"
            >
              <div className="flex items-center text-lg">
                <FiChrome className="mr-5 text-xl" />
                Sign in with Google
              </div>
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-primary overflow-y-hidden">
      <Navbar />
      <Body />
      <Footer />
    </div>
  );
}
