"use client";

import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CardsCreateAccount({
  handleSignIn,
}: {
  handleSignIn: () => void;
}) {
  return (
    <Card className="rounded-md w-full mt-3 border text-white border-white border-opacity-10 bg-orange-600 bg-opacity-1">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription className="text-muted-foreground text-opacity-60">
          Sign in or create an account using Google to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <Button
          variant="outline"
          onClick={handleSignIn}
          className="bg-orange-600 bg-opacity-1 px-4 py-2 rounded-md w-full border border-white border-opacity-5 text-white flex justify-center"
        >
          <Icons.google className="mr-2 h-4 w-4" />
          Google
        </Button>
      </CardContent>
    </Card>
  );
}
