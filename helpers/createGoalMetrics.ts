export const createGoalMetrics = (userData: UserData) => {
  const goalMetrics: { goal: number; watched: number }[] = [];
  let lastGoal = 0; // Initialize the lastGoal variable to track the most recent goal

  const dates = Object.keys(userData.goal_info);
  const mostRecentDate = dates.reduce((latest, current) =>
    new Date(latest) > new Date(current) ? latest : current
  );
  const mostRecentGoal = userData.goal_info[mostRecentDate].daily_goal;

  // Loop through all dates in goal_info
  for (const date in userData.watched_info) {
    // Check if a goal exists for the current date, otherwise use the last goal
    const dailyGoal = userData.goal_info[date]?.daily_goal || mostRecentGoal;

    // If a goal is found for the current date, update lastGoal
    if (userData.goal_info[date]?.daily_goal) {
      lastGoal = userData.goal_info[date].daily_goal;
    }

    // Get watched minutes for the date, defaulting to 0 if not available
    const watchedMinutes = userData.watched_info[date]?.minutes_watched || 0;

    goalMetrics.push({
      goal: dailyGoal,
      watched: watchedMinutes,
    });
  }

  return goalMetrics;
};

// Example Usage
