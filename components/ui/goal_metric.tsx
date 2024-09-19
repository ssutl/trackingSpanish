import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";

const hasBeatGoalToday = [
  "Another day, another dollar 💸",
  "Another one! 🆒",
  "No days off, another goal beat! 🚀",
  "Good job, you have beat your goal again! 🎉",
  "Small wins add up, keep going G! 🥭",
  "It's all about consistency, and you are doing great! 🌟",
];

const hasNotBeatGoalToday = [
  "Cmon G, we got goals to hit. 💪",
  "Lock in, hit that goal, we rest after! 🥭",
  "Oi no cupcaking 🧁, gotta reach that goal!",
  "How you on social media but you aint watched your daily Spanish content? 🤔",
  "Number 1 rule, don't lie to yourself. You said you were going to hit the goal, so hit it! 🥭",
  "Ain't even asking for too much, just turn on some Spanish content looool 🇪🇸",
  "SS.UTL defo done his numbers today, whilst your cupcaking 🧁🥭",
  "RN I'm coding this extension, putting in work. Have you even reached your goals today? Lets work 🥭",
  "You wanna learn Spanish, but your not doing the numbers? Ion get it 🤔",
  "Goggins is probably running right now, all you gotta do is watch some Spanish content 🥭",
  "I believe in you always, make sure to believe in yourself too. Hit that goal! 🥭",
  "Hm hm hmmmm. Stay healthy, stay hydrated, stay consistent. 🥭",
];

const hitGoalYesterdayButNotToday = [
  "Cmon G, we got goals to hit. 💪",
  "Lock in, hit that goal, we rest after! 🥭",
  "Oi no cupcaking 🧁, gotta reach that goal!",
  "How you on social media but you aint watched your daily Spanish content? 🤔",
  "Number 1 rule, don't lie to yourself. You said you were going to hit the goal, so hit it! 🥭",
  "Ain't even asking for too much, just turn on some Spanish content looool 🇪🇸",
  "SS.UTL defo done his numbers today, whilst your cupcaking 🧁🥭",
  "How were you better yesterday than today? 🤔 Make sure you hit ur goals mann! I believe en ti 🥭",
  "Stay consistent, that's all that matters. You did it yesterday, so go again 🥭",
  "No one cares what you did yesterday, what are you doing today? Hit that goal G 💸🤔",
  "Discipline is just a series of small decisions. Notice them and make the right choice. 🥭",
  "SS.UTL defo done his numbers today, whilst your cupcaking 🧁🥭",
  "RN I'm coding this extension, putting in work. Have you even reached your goals today? Lets work 🥭",
  "I've done minimum 60 press ups today, stretched for 30 mins, probably about 2 hours of Spanish and most definetly consumed plenty water. Make sure your working too 🥭",
];

export function GoalMetrics({
  data,
}: {
  data: { goal: number; watched: number; date: string }[];
}) {
  const today = new Date()
    .toLocaleDateString()
    .replace(/\./g, "-")
    .replace(/\//g, "-")
    .replace(/\[/g, "-")
    .replace(/\]/g, "-");
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    .toLocaleDateString()
    .replace(/\./g, "-")
    .replace(/\//g, "-")
    .replace(/\[/g, "-")
    .replace(/\]/g, "-");

  const todayData = data.find((item) => item.date === today);
  console.log("todayData", todayData);
  const yesterdayData = data.find((item) => item.date === yesterday);
  console.log("yesterdayData", yesterdayData);

  let quote = "";

  // Randomize quote function
  const getRandomQuote = (quotesArray: string[]) => {
    return quotesArray[Math.floor(Math.random() * quotesArray.length)];
  };

  if (todayData && todayData.watched >= todayData.goal) {
    // User met their goal today
    quote = getRandomQuote(hasBeatGoalToday);
  } else if (yesterdayData && yesterdayData.watched >= yesterdayData.goal) {
    // User hit their goal yesterday but not today
    quote = getRandomQuote(hitGoalYesterdayButNotToday);
  } else {
    // User has not hit their goal today
    quote = getRandomQuote(hasNotBeatGoalToday);
  }

  return (
    <Card className="rounded-md w-full mt-3 border text-white border-white border-opacity-10 bg-orange-600 bg-opacity-1">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Are you hitting your goals?</CardTitle>
        <CardDescription>{quote}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[220px] flex items-center">
          <ResponsiveContainer width="100%">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 0,
              }}
              height={215}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-md border border-white border-opacity-30 p-2 shadow-sm bg-secondary bg-opacity-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground text-orange-400 text-opacity-60">
                              Goal
                            </span>
                            <span className="font-bold text-muted-foreground text-orange-400 text-opacity-60">
                              {payload[0].value}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground text-orange-400">
                              Watched
                            </span>
                            <span className="font-bold text-orange-400">
                              {payload[1].value}
                            </span>
                          </div>
                        </div>
                        <div className="text-[0.70rem] text-muted-foreground text-opacity-60 mt-2 text-bold">
                          {payload[0].payload.date}
                        </div>
                      </div>
                    );
                  }

                  return null;
                }}
              />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="goal"
                activeDot={{
                  r: 6,
                  style: { fill: "#3c1f0b", opacity: 0.6 },
                }}
                style={
                  {
                    stroke: "#3c1f0b",
                    opacity: 0.6,
                  } as React.CSSProperties
                }
              />
              <Line
                type="monotone"
                dataKey="watched"
                strokeWidth={2}
                activeDot={{
                  r: 6,
                  style: { fill: "#ef6c00" },
                }}
                style={
                  {
                    stroke: "#ef6c00",
                  } as React.CSSProperties
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
