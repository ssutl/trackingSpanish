import React, { useEffect } from "react";
import { FiChrome } from "react-icons/fi";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBU94yh1GICwAQbH6Sk1RvuJPrqlT4E2tA",
  databaseURL:
    "https://trackingspanish-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function Home() {
  const [user, setUser] = React.useState<GoogleUser>(null);
  const [watchingSpanish, setWatchingSpanish] = React.useState<boolean>(false);
  const [currentPage, setCurrentPage] = React.useState<
    "Stats" | "Levels" | "Settings"
  >("Stats");
  const [userData, setUserData] = React.useState<UserData | null>(null);

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

  useEffect(() => {
    if (user) {
      const userId = user.uid;
      const userRef = ref(db, `Users/${userId}`);

      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setUserData(data);
      });
    }
  }, [user]);

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
      <h1 className="text-xl font-medium font-sans">Tracking Spanish</h1>
    </div>
  );

  const Footer = () =>
    user && (
      <div className="w-full flex text-white border-t px-10 h-16 border-white border-opacity-5 "></div>
    );

  const StatsPage = () => {
    const today = new Date()
      .toLocaleDateString()
      .replace(/\./g, "-")
      .replace(/\//g, "-")
      .replace(/\[/g, "-")
      .replace(/\]/g, "-");
    const minutesWatchedToday = userData.watched_info[today] || 0;
    const progressPercentage = Math.min(
      (minutesWatchedToday / userData.daily_goal) * 100,
      100
    );
    //calculate the total watched minutes
    let totalWatched = 0;
    for (const key in userData.watched_info) {
      totalWatched += userData.watched_info[key];
    }

    // Helper function to format minutes into hours and minutes
    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return hours > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${remainingMinutes} minutes`;
    };

    // Calculate the current streak of consecutive days watched
    const calculateStreak = (watchedInfo: { [date: string]: number }) => {
      const dates = Object.keys(watchedInfo).sort();
      let streak = 0;
      let currentStreak = 0;
      let previousDate: Date | null = null;

      dates.forEach((date) => {
        const currentDate = new Date(date);
        if (previousDate) {
          const diffTime = Math.abs(
            currentDate.getTime() - previousDate.getTime()
          );
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        streak = Math.max(streak, currentStreak);
        previousDate = currentDate;
      });

      return Math.min(streak, 7); // Cap the streak at 7
    };

    const currentStreak = calculateStreak(userData.watched_info);

    return (
      <div className="w-full">
        <h2 className="text-xl mt-5 text-orange-400 font-medium">
          Daily Progress
        </h2>
        <h3 className="text-lg mt-3 text-white font-normal">
          {minutesWatchedToday} minutes
        </h3>
        <p className="text-base mt-0 text-white font-normal opacity-30">
          out of {userData.daily_goal} minutes goal
        </p>
        <div className="w-full rounded-2xl bg-secondary h-5 mt-2 overflow-hidden">
          <div
            style={{
              width: `${progressPercentage}%`,
              transition: "width 1s ease-in-out",
            }}
            className="h-full bg-white"
          ></div>
        </div>
        <h2 className="text-xl mt-10 text-orange-400 font-medium">
          Total Watched
        </h2>
        <h1 className="text-5xl mt-3 text-white font-bold">
          {formatTime(totalWatched)}
        </h1>
        <h2 className="text-xl mt-10 text-orange-400 font-medium">
          Current Streak
        </h2>
        <h3 className="text-lg mt-3 text-white font-normal">
          {currentStreak} days
        </h3>
      </div>
    );
  };

  const Body = () => {
    return (
      <div className="flex-grow w-full px-10 flex flex-col items-center ">
        {user ? (
          <>{currentPage === "Stats" && userData && <StatsPage />}</>
        ) : (
          // Login page
          <>
            <button
              onClick={handleSignIn}
              className="bg-secondary px-4 py-2 rounded-md w-full border border-white border-opacity-5 text-white flex justify-center"
            >
              <div className="flex items-center text-lg font-sans">
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
