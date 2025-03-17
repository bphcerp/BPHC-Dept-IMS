import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface ExamStatusListProps {
  status: string;
}

export function ExamStatusList({ status }: ExamStatusListProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardContent className="flex items-center justify-center pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            {status == "Pass" ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="mr-2 h-6 w-6" />
                <span className="font-semibold">PASS</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <XCircle className="mr-2 h-6 w-6" />
                <span className="font-semibold">FAIL</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
