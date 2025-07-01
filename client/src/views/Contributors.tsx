import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import peopleData from "@/data/contributors.json";

type Person = {
  id: string;
  name: string;
  imageUrl: string;
  url: string;
};

type PeopleData = {
  professors: Person[];
  students: Person[];
};

const ProfilePage = () => {
  const { professors, students } = peopleData as PeopleData;
  const sortedStudents = [...students].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  const renderSection = (title: string, people: Person[]) => (
    <div className="mb-12">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {people.map((person) => (
          <a
            key={person.id}
            href={person.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl transition-shadow hover:shadow-lg"
          >
            <Card className="flex h-full flex-col items-center justify-center py-8">
              <CardContent className="flex flex-col items-center justify-center p-0">
                <Avatar className="mb-4 h-28 w-28">
                  <img
                    src={person.imageUrl}
                    alt={person.name}
                    className="h-28 w-28 rounded-full object-cover object-center"
                  />
                </Avatar>
                <div className="text-center text-lg font-medium text-foreground">
                  {person.name}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {person.id}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <AppSidebar items={[]} />
      <div className="flex min-h-screen w-full flex-col">
        <div className="border-b bg-background p-4">
          <h1 className="text-2xl font-semibold">Contributors</h1>
        </div>
        <div className="flex-1 p-6">
          {renderSection("Students", sortedStudents)}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
