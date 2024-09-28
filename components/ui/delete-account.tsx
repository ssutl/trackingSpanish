"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteAccount({ handleDelete }: { handleDelete: () => void }) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  return (
    <Card className="w-full mt-3 rounded-md border border-white border-opacity-10 bg-opacity-1 bg-orange-600 text-white">
      <CardHeader>
        <CardTitle className="text-base">Delete Account</CardTitle>
        <CardDescription className="text-white text-opacity-60">
          Deleting your account is{" "}
          <span className="text-orange-400">permanent</span>. All your data will
          be permanently removed and{" "}
          <span className="text-orange-400">cannot be recovered</span>.
        </CardDescription>
        <CardDescription className="text-white text-opacity-60">
          To confirm, please type{" "}
          <span className="text-orange-400 font-bold">"DELETE"</span> in the
          input below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          className="w-full border mb-3 border-white border-opacity-5 outline-none bg-transparent text-white rounded-md"
          placeholder="Type DELETE to confirm"
          value={deleteConfirmation}
          onChange={(e) => setDeleteConfirmation(e.target.value)}
        />
        <Button
          variant="destructive"
          className={`w-full border border-white border-opacity-5 bg-transparent hover:bg-transparent ${
            deleteConfirmation === "DELETE" ? "bg-orange-400" : ""
          }`}
          disabled={deleteConfirmation !== "DELETE"}
          onClick={handleDelete}
        >
          Delete Account
        </Button>
      </CardContent>
    </Card>
  );
}
