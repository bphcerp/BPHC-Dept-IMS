import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const SupervisedStudents = () => {
  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Supervised Students
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
};

export default SupervisedStudents;
