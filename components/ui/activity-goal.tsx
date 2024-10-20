"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer } from "recharts";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const data = [
  {
    goal: 400,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 239,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 349,
  },
];

export function CardsActivityGoal({ currentDailyGoal, setEditingGoal }) {
  const [newDailyGoal, setNewDailyGoal] = React.useState<number>(
    currentDailyGoal ? currentDailyGoal : 10
  );

  const handleDailyGoal = async () => {
    if (newDailyGoal > 0 && newDailyGoal !== currentDailyGoal) {
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

  return (
    <Card className="rounded-md w-full mt-3 border text-white border-white border-opacity-10 bg-orange-600 bg-opacity-1">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Daily Goal</CardTitle>
        <CardDescription>Set your daily watch goal.</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full bg-transparent border-opacity-5"
            onClick={() => {
              if (newDailyGoal >= 10) {
                setNewDailyGoal(newDailyGoal - 10);
              }
            }}
            disabled={newDailyGoal <= 0}
          >
            <Minus className="h-4 w-4" />
            <span className="sr-only">Decrease</span>
          </Button>
          <div className="flex-1 text-center">
            <div className="text-5xl font-bold tracking-tighter">
              {newDailyGoal}
            </div>
            <div className="text-[0.70rem] mt-2 uppercase text-muted-foreground">
              Minutes/day
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full bg-transparent border-opacity-5"
            onClick={() => setNewDailyGoal(newDailyGoal + 10)}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Increase</span>
          </Button>
        </div>
        <div className="my-3 h-[60px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <Bar dataKey="goal" className="opacity-90" fill="#3c1f0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full rounded-md border border-white border-opacity-5 bg-transparent  ${
            newDailyGoal !== currentDailyGoal
              ? "bg-orange-400"
              : "bg-transparent"
          }`}
          onClick={handleDailyGoal}
        >
          Set Goal
        </Button>
      </CardFooter>
    </Card>
  );
}
