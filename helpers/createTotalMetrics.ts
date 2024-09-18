interface WatchedDataPoint {
  watched: number;
  date: string; // formatted as YY-MM-DD
}

export function createTotalWatchedMetrics(
  userData: UserData
): WatchedDataPoint[] {
  const result: WatchedDataPoint[] = [];

  // Get all dates from watched_info and sort them
  const allDates = Object.keys(userData.watched_info).sort();

  let cumulativeWatched = 0;

  allDates.forEach((date) => {
    const watchedInfo = userData.watched_info[date];
    cumulativeWatched += watchedInfo ? watchedInfo.minutes_watched : 0;

    // Convert date to "YY-MM-DD" format
    const formattedDate = new Date(date)
      .toLocaleDateString()
      .replace(/[/\.\[\]]/g, "-");

    // Prepare the data point with cumulative total
    const dataPoint: WatchedDataPoint = {
      date: formattedDate, // YY-MM-DD format
      watched: cumulativeWatched,
    };

    result.push(dataPoint);
  });

  return result;
}
