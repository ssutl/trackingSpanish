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
import { MdAccountCircle } from "react-icons/md";
import { CardsActivityGoal } from "@/components/ui/activity-goal";
import { GoalMetrics } from "@/components/ui/goal_metric";
import { createGoalMetrics } from "../helpers/createGoalMetrics";
import { TotalTimeStats } from "@/components/ui/totalWatched";
import { createTotalWatchedMetrics } from "../helpers/createTotalMetrics";
import { CardsCreateAccount } from "@/components/ui/create-account";
import { Button } from "@/components/ui/button";
import { DeleteAccount } from "@/components/ui/delete-account";

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
  const [userData, setUserData] = React.useState<UserData | null | undefined>(
    undefined
  );
  const [editingGoal, setEditingGoal] = React.useState<boolean>(false);
  const [daily_goal, setDailyGoal] = React.useState<number>(10);

  const withinTrialDate = userData
    ? new Date(userData.created_at).getTime() + 7 * 24 * 60 * 60 * 1000 >
      Date.now()
    : false;
  const displayTrialBanner = withinTrialDate && !userData.paid;
  const displayUpgrade = !withinTrialDate && !userData?.paid;

  useEffect(() => {
    getUserFromStorage();

    // We need to send message to backend to say pop_up_opnened
    chrome.runtime.sendMessage({ type: "POPUP_OPENED" });
  }, []);

  // USER LOGGED IN STATE ISNT WORKING
  useEffect(() => {
    if (user) {
      const userId = user.uid;
      const userRef = ref(db, `Users/${userId}`);

      onValue(userRef, (snapshot) => {
        //if snapshot is null, then user is not in the database and we should clear storage
        if (!snapshot.exists()) {
          setUser(null);
          setUserData(null);
          //clear all local storage
          chrome.storage.local.clear();
          return;
        }
        const data = snapshot.val();
        setUserData(data);

        const dates = Object.keys(data.goal_info);
        const mostRecentDate = dates.reduce((latest, current) =>
          new Date(latest) > new Date(current) ? latest : current
        );
        const mostRecentGoal = data.goal_info[mostRecentDate].daily_goal;
        setDailyGoal(mostRecentGoal);
      });
    }
  }, [user]);

  const getUserFromStorage = () => {
    chrome.storage.local.get(["user"], (result) => {
      const user = result.user as GoogleUser;
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        setUserData(null);
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

  const handleDelete = async () => {
    // Handle
    const res = await chrome.runtime.sendMessage({ type: "DELETE_ACCOUNT" });

    if (res.success) {
      setUserData(null);
      setUser(null);
      console.log("Account deleted");
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
          <MdAccountCircle className="text-xl" />
        </button>
      </div>
    );

  const UpgradeComponent = () => {
    return (
      <div
        className="w-full flex flex-col items-center justify-center h-full cursor-pointer"
        onClick={handleBannerClick}
      >
        <div className="flex flex-col text-white max-w-96">
          <h1 className="text-5xl font-bold mb-5">
            Unlock Your <span className="text-orange-400">Spanish</span>{" "}
            Learning Potential
          </h1>
          <p className="text-base mb-5 text-white font-normal opacity-30">
            Track your YouTube watching time and reach your daily Spanish goals!
            Upgrade with a one-time payment of £5, and get unlimited access
            forever.
          </p>
          <Button className="w-full border border-white border-opacity-5 bg-transparent hover:bg-orange-400">
            Upgrade
          </Button>
        </div>
      </div>
    );
  };

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
      (minutesWatchedToday / daily_goal) * 100,
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
    const calculateStreak = (watchedInfo: {
      [key: string]: { minutes_watched: number; synced_with_ds: boolean };
    }) => {
      let streak = 0;
      let currentDate = new Date();

      const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      let currentDateString = formatDate(currentDate);

      // Loop to calculate the streak
      while (
        watchedInfo[currentDateString] &&
        watchedInfo[currentDateString].minutes_watched > 0
      ) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
        currentDateString = formatDate(currentDate);
      }

      // Limit the streak to a maximum of 7 days
      return Math.min(streak, 7);
    };

    const currentStreak = calculateStreak(userData.watched_info);

    const goalMetrics = createGoalMetrics(userData);
    const totalMetrics = createTotalWatchedMetrics(userData);

    if (displayUpgrade) {
      return <UpgradeComponent />;
    }

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
            <CardsActivityGoal
              currentDailyGoal={daily_goal}
              setEditingGoal={(val) => setEditingGoal(val)}
            />
          ) : (
            <>
              <h3 className="text-lg mt-3 text-white font-normal">
                {minutesWatchedToday} minutes
              </h3>
              <p className="text-base mt-0 text-white font-normal opacity-30">
                out of {daily_goal} minutes goal
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
            className="rounded-md  text-white w-full mt-3 border border-white border-opacity-5 flex  bg-orange-600 bg-opacity-1"
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
        {goalMetrics.length > 1 && (
          <div>
            <h2 className="text-xl text-orange-400 font-medium">
              Your Goal Activity
            </h2>
            <GoalMetrics data={goalMetrics} />
          </div>
        )}
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

    if (displayUpgrade) {
      return <UpgradeComponent />;
    }

    return (
      <div className="w-full flex flex-col">
        <h2 className="text-xl text-orange-400 font-medium">Levels</h2>
        {levels.map((level, index) => {
          const requiredMinutes = level.hours_of_input * 60;
          const percentage = Math.min(
            (totalWatched / requiredMinutes) * 100,
            100
          );
          const userGoalPerDay = daily_goal;
          const minutesLeft = requiredMinutes - totalWatched;
          const daysToReach = Math.ceil(minutesLeft / userGoalPerDay);

          return (
            <div
              key={index}
              className="w-full relative rounded-md p-5 border border-white border-opacity-5 mt-5 overflow-hidden bg-orange-600 bg-opacity-1"
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
        <h2 className="text-xl text-orange-400 font-medium">Account</h2>
        <DeleteAccount handleDelete={handleDelete} />
      </div>
    );
  };

  const handleBannerClick = () => {
    if (user) {
      chrome.tabs.create({
        url: `https://trackingspanish.vercel.app/confirm/${user.uid}`,
      });
    }
  };

  const Body = () => {
    return (
      <div
        className={`w-full flex px-10 py-5 flex-col overflow-y-scroll no-scrollbar relative ${
          userData ? "h-[calc(100vh-128px)]" : "h-[calc(100vh-64px)]"
        }`}
      >
        {displayTrialBanner && (
          <div
            className="w-full bg-secondary bg-opacity-1 border border-white border-opacity-5 text-white py-2 px-3 rounded-md mb-10 cursor-pointer hover:bg-orange-400"
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
        {userData ? (
          <>
            {currentPage === "Stats" && userData && <StatsPage />}
            {currentPage === "Levels" && <LevelPage />}
            {currentPage === "Settings" && <SettingsPage />}
          </>
        ) : userData === undefined ? (
          // Loading
          <p className="text-base  text-white font-normal opacity-30">
            Loading...
          </p>
        ) : (
          // Login page
          <>
            <CardsCreateAccount handleSignIn={handleSignIn} />
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
