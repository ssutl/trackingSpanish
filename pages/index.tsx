import React, { useEffect, useRef } from "react";
import { FiChrome } from "react-icons/fi";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { LiaFireAltSolid } from "react-icons/lia";
import { Calendar } from "@/components/ui/calendar";
import { LuPencil } from "react-icons/lu";
import { PiSignOut } from "react-icons/pi";
import { IoStatsChart } from "react-icons/io5";
import { GiProgression } from "react-icons/gi";
import { PiExportFill } from "react-icons/pi";

const firebaseConfig = {
  apiKey: "AIzaSyBU94yh1GICwAQbH6Sk1RvuJPrqlT4E2tA",
  databaseURL:
    "https://trackingspanish-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const levels = [
  {
    name: "Level 0",
    description:
      "You understand a lot of what you hear, but speaking confidently is still difficult.",
    hours_of_input: 0,
  },
  {
    name: "Level 1",
    description:
      "Your comprehension is improving, and you can follow more everyday conversations, but speaking remains challenging.",
    hours_of_input: 50,
  },
  {
    name: "Level 2",
    description:
      "You can follow native conversations with effort, understanding the main ideas, though speaking is still limited.",
    hours_of_input: 150,
  },
  {
    name: "Level 3",
    description:
      "You can both understand and contribute to conversations, expressing yourself more comfortably with native speakers.",
    hours_of_input: 300,
  },
];

export default function Home() {
  const [user, setUser] = React.useState<GoogleUser>(null);
  const [watchingSpanish, setWatchingSpanish] = React.useState<boolean>(false);
  const [currentPage, setCurrentPage] = React.useState<
    "Stats" | "Levels" | "Settings"
  >("Stats");
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [editingGoal, setEditingGoal] = React.useState<boolean>(false);
  const [newDailyGoal, setNewDailyGoal] = React.useState<number>(
    userData ? userData.daily_goal : 10
  );
  const withinTrialDate = userData
    ? new Date(userData.created_at).getTime() + 7 * 24 * 60 * 60 * 1000 >
      Date.now()
    : false;
  const displayTrialBanner = withinTrialDate && !userData.paid;

  useEffect(() => {
    getUserFromStorage();
  }, []);

  // USER LOGGED IN STATE ISNT WORKING
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
      }
    });
  };

  const handleSignIn = async () => {
    // send message to background.js
    const res = await chrome.runtime.sendMessage({ type: "sign_in" });
    if (res.success) {
      getUserFromStorage();
    }
  };

  const handleSignOut = async () => {
    // send message to background.js
    const res = await chrome.runtime.sendMessage({ type: "sign_out" });

    if (res.success) {
      setUserData(null);
      setUser(null);
      console.log("User signed out");
    }
  };

  const handleDailyGoal = async () => {
    if (newDailyGoal > 0) {
      const res = await chrome.runtime.sendMessage({
        type: "UPDATE_DAILY_GOAL",
        dailyGoal: newDailyGoal,
      });

      if (res.success) {
        setEditingGoal(false);
      } else {
        alert("Error updating daily goal");
      }
    } else {
      alert("Please enter a valid goal");
    }
  };

  const Navbar = () => (
    <div className="w-full flex justify-center items-center px-10 h-16 border-b border-white border-opacity-5 text-white">
      {userData ? (
        <>
          <div className="rounded-full bg-secondary w-10 h-10 flex items-center justify-center mr-auto">
            <img src={user.photoURL} className="w-8 h-8 rounded-full" />
          </div>
          <div
            className=" hover:bg-secondary rounded-md p-1 cursor-pointer"
            onClick={() => handleSignOut()}
          >
            <PiSignOut className="text-white text-xl" />
          </div>
        </>
      ) : (
        <h1 className="text-xl font-medium">Tracking Spanish</h1>
      )}
    </div>
  );

  const Footer = () =>
    user && (
      <div className="w-full flex text-white border-t px-10 h-16 border-white border-opacity-5 ">
        <button
          onClick={() => setCurrentPage("Stats")}
          className={`flex-1 flex items-center justify-center ${
            currentPage === "Stats"
              ? "border-t-2 border-orange-400 "
              : "hover:bg-secondary hover:bg-opacity-10"
          }`}
        >
          <IoStatsChart className="text-xl" />
        </button>
        <button
          onClick={() => setCurrentPage("Levels")}
          className={`flex-1 flex items-center justify-center ${
            currentPage === "Levels"
              ? "border-t-2 border-orange-400"
              : "hover:bg-secondary hover:bg-opacity-10"
          }`}
        >
          <GiProgression className="text-xl" />
        </button>
        <button
          onClick={() => setCurrentPage("Settings")}
          className={`flex-1 flex items-center justify-center ${
            currentPage === "Settings"
              ? "border-t-2 border-orange-400"
              : "hover:bg-secondary hover:bg-opacity-10"
          }`}
        >
          <PiExportFill className="text-xl" />
        </button>
      </div>
    );

  const StatsPage = () => {
    const today = new Date()
      .toLocaleDateString()
      .replace(/\./g, "-")
      .replace(/\//g, "-")
      .replace(/\[/g, "-")
      .replace(/\]/g, "-");

    const minutesWatchedToday =
      (userData.watched_info[today] &&
        userData.watched_info[today].minutes_watched) ||
      0;
    const progressPercentage = Math.min(
      (minutesWatchedToday / userData.daily_goal) * 100,
      100
    );
    //calculate the total watched minutes
    let totalWatched = 0;
    for (const key in userData.watched_info) {
      totalWatched += userData.watched_info[key].minutes_watched;
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
    const calculateStreak = (watchedInfo) => {
      let streak = 0;
      let currentDate = new Date();
      let currentDateString = currentDate
        .toLocaleDateString()
        .replace(/\./g, "-")
        .replace(/\//g, "-")
        .replace(/\[/g, "-")
        .replace(/\]/g, "-");

      while (watchedInfo[currentDateString] > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
        currentDateString = currentDate
          .toLocaleDateString()
          .replace(/\./g, "-")
          .replace(/\//g, "-")
          .replace(/\[/g, "-")
          .replace(/\]/g, "-");
      }
      const finalStreak = Math.min(streak, 7);
      return finalStreak;
    };

    const currentStreak = calculateStreak(userData.watched_info);

    return (
      <div className="w-full space-y-10">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-orange-400 font-medium">
              Daily Progress
            </h2>
            <button
              className="flex text-base items-center text-white"
              onClick={() => setEditingGoal(!editingGoal)}
            >
              <LuPencil className="mr-2" />
              Edit Goal
            </button>
          </div>
          {editingGoal ? (
            <div className="flex items-center mt-5">
              <input
                type="number"
                placeholder={userData.daily_goal.toString()}
                className="text-white border-opacity-5 border bg-transparent border-white rounded-md p-2 w-20 mr-4 hover:bg-secondary"
                onChange={(e) => {
                  setNewDailyGoal(parseInt(e.target.value));
                }}
                value={newDailyGoal}
                defaultValue={newDailyGoal}
                autoFocus
              />
              <p className="text-base text-white font-normal mr-4 bg-opacity-20">
                min/day
              </p>
              <button
                type="submit"
                className={`py-2 px-4 border border-white border-opacity-5 rounded-md text-white ${
                  newDailyGoal > 0 &&
                  newDailyGoal !== userData.daily_goal &&
                  "bg-orange-400 cursor-pointer"
                }`}
                onClick={handleDailyGoal}
                disabled={
                  !(newDailyGoal > 0 && newDailyGoal !== userData.daily_goal)
                }
              >
                Update
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg mt-3 text-white font-normal">
                {minutesWatchedToday} minutes
              </h3>
              <p className="text-base mt-0 text-white font-normal opacity-30">
                out of {userData.daily_goal} minutes goal
              </p>
              <div className="w-full rounded-2xl bg-secondary h-5 mt-2 overflow-hidden">
                <div
                  style={{
                    transform: `translateX(-${
                      100 - (progressPercentage || 0)
                    }%)`,
                    transition: "transform 3s ease-in-out",
                  }}
                  className="h-full bg-white"
                ></div>
              </div>
            </>
          )}
        </div>
        <div>
          <h2 className="text-xl text-orange-400 font-medium">Total Watched</h2>
          <h1 className="text-5xl mt-3 text-white font-bold">
            {formatTime(totalWatched)}
          </h1>
        </div>
        <div>
          <h2 className="text-xl text-orange-400 font-medium">
            Days Practiced
          </h2>
          <div className="flex w-full items-center mt-3">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center ">
              <LiaFireAltSolid className="text-white text-4xl " />
            </div>
            <div className="ml-4">
              <h3 className="text-lg mt-3 text-white font-normal">
                {currentStreak}
                {` day${currentStreak > 1 ? "s" : ""}`}
              </h3>
              <p className="text-base mt-0 text-white font-normal opacity-30">
                out of a maximum of 7 days
              </p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-xl text-orange-400 font-medium">Your Activity</h2>
          <Calendar
            mode="single"
            className="rounded-md text-white w-full mt-3 border border-white border-opacity-5 flex"
            classNames={{
              months:
                "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
              month: "space-y-4 w-full flex flex-col",
              table: "w-full h-full border-collapse space-y-1",
              head_row: "",
              row: "w-full mt-2",
            }}
            components={{
              Day: (props: CustomDayCellProps) => <CustomDayCell {...props} />,
            }}
          />
        </div>
      </div>
    );
  };

  // Custom day cell component
  const CustomDayCell: React.FC<CustomDayCellProps> = ({
    displayMonth,
    date,
  }) => {
    const dateString = new Date(date)
      .toLocaleDateString()
      .replace(/\./g, "-")
      .replace(/\//g, "-")
      .replace(/\[/g, "-")
      .replace(/\]/g, "-");

    const minutesWatched =
      (userData.watched_info[dateString] &&
        userData.watched_info[dateString].minutes_watched) ||
      0;

    return (
      <div className="flex flex-col rounded-md hover:bg-secondary py-2">
        {/* Fixed-height container */}
        <div className="flex w-full items-center justify-center">
          <div>{new Date(date).getDate()}</div>
        </div>
        <div className="flex w-full items-center justify-center text-xs text-orange-400 h-6">
          {minutesWatched > 0 && `${minutesWatched}m`}
        </div>
      </div>
    );
  };

  const LevelPage = () => {
    // Calculate the total minutes watched
    let totalWatched = 0;
    for (const key in userData.watched_info) {
      totalWatched += userData.watched_info[key].minutes_watched;
    }
    console.log("totalWatched", totalWatched);

    return (
      <div className="w-full flex flex-col">
        <h2 className="text-xl text-orange-400 font-medium">Levels</h2>
        {levels.map((level, index) => {
          const requiredMinutes = level.hours_of_input * 60;
          console.log("requiredMinutes", requiredMinutes);
          const percentage = Math.min(
            (totalWatched / requiredMinutes) * 100,
            100
          );
          const userGoalPerDay = userData.daily_goal;
          const minutesLeft = requiredMinutes - totalWatched;
          const daysToReach = Math.ceil(minutesLeft / userGoalPerDay);

          return (
            <div
              key={index}
              className="w-full relative rounded-md p-5 border border-white border-opacity-5 mt-5 overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 h-full ${
                  percentage === 100 ? `bg-orange-400` : `bg-secondary`
                }`}
                style={{
                  width: `${percentage}%`,
                  transition: "width 0.5s ease-in-out",
                }}
              ></div>
              <div className="relative z-10 text-white">
                <h1 className="text-5xl text-white font-bold">{level.name}</h1>
                <h3 className="text-lg mt-3 text-white font-normal">
                  {level.description}
                </h3>
                <p className="text-base mt-3 text-white font-normal">
                  {`Hours of input: ${level.hours_of_input}`}
                </p>
                {percentage < 100 && (
                  <p className="text-base mt-3 text-white font-normal opacity-30">
                    {`You'll reach this level in ${daysToReach} days based on your current daily goal`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const SettingsPage = () => {
    return (
      <div className="w-full">
        <h2 className="text-xl text-orange-400 font-medium">Export Data</h2>
      </div>
    );
  };

  const handleBannerClick = () => {
    if (user) {
      chrome.tabs.create({
        url: `https://trackingspanish.vercel.app/${user.uid}`,
      });
    }
  };

  const Body = () => {
    return (
      <div
        className={`w-full flex px-10 py-5 flex-col overflow-y-scroll no-scrollbar ${
          userData ? "h-[calc(100vh-128px)]" : "h-[calc(100vh-64px)]"
        }`}
      >
        {displayTrialBanner && (
          <div
            className="w-full bg-secondary border border-white border-opacity-5 text-white p-2 rounded-md mb-10"
            onClick={handleBannerClick}
          >
            <p className="text-center">
              You have{" "}
              {7 -
                Math.floor(
                  (Date.now() - new Date(userData.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
              days left in your trial. Click to upgrade for unlimited access.
            </p>
          </div>
        )}
        {userData && (withinTrialDate || userData.paid) ? (
          <>
            {currentPage === "Stats" && userData && <StatsPage />}
            {currentPage === "Levels" && <LevelPage />}
            {currentPage === "Settings" && <SettingsPage />}
          </>
        ) : userData && (!withinTrialDate || !userData.paid) ? (
          <>
            <h1 className="text-white text-center">PAY ME NIGGGAAAAHH</h1>
          </>
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
      {Body()}
      <Footer />
    </div>
  );
}
