import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const SupervisedStudents = () => {
  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Supervised Students</h1>
          <p className="mt-2 text-gray-600">Manage and view your supervised PhD students</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Student Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-gray-500">Student management features will be available soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupervisedStudents;
