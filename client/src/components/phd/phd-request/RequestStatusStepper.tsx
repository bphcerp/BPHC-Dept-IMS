import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  reviewer: {
    name: string;
    email: string;
  };
  approved: boolean;
  comments: string | null;
  createdAt: string;
  reviewerDisplayName: string;
}

interface RequestStatusStepperProps {
  reviews: Review[];
  request: {
    drcAssignments: {
      drcMemberEmail: string;
      status: string;
    }[];
  };
}

export const RequestStatusStepper: React.FC<RequestStatusStepperProps> = ({
  reviews,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request History</CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">
            No review history yet. The request is pending initial review.
          </p>
        ) : (
          <ol className="relative ml-2 border-l border-gray-200 dark:border-gray-700">
            {reviews.map((review, index) => (
              <li key={index} className="mb-10 ml-6">
                <span
                  className={cn(
                    "absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900",
                    review.approved
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-red-100 dark:bg-red-900"
                  )}
                >
                  {review.approved ? (
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                  )}
                </span>
                <h3 className="mb-1 flex flex-wrap items-center text-lg font-semibold text-gray-900 dark:text-white">
                  {review.reviewerDisplayName}
                  <span
                    className={cn(
                      "ml-3 mt-1 rounded px-2.5 py-0.5 text-sm font-medium sm:mt-0",
                      review.approved
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    )}
                  >
                    {review.approved ? "Approved" : "Reverted"}
                  </span>
                </h3>
                <time className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                  Reviewed on {new Date(review.createdAt).toLocaleString()}
                </time>
                {review.comments && (
                  <p className="rounded-md border bg-muted/50 p-3 text-base font-normal text-gray-600 dark:text-gray-400">
                    {review.comments}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};
