import { SectionClient } from "node_modules/lib/src/types/allocation";
import React from "react";
import { Card, CardContent, CardTitle } from "../ui/card";

interface AddSectionProps {
  section: SectionClient;
  number: number;
}

const AddSectionCard: React.FC<AddSectionProps> = ({ section, number }) => {
  return (
    <Card className="pt-4">
      <CardContent className="flex flex-col gap-2">
        <CardTitle>{section.type + " " + number}</CardTitle>
        <div className="flex gap-2">
          <div className="text-md font-medium uppercase">Instructors : </div>
          {section.instructors.map((instructor, ind) => (
            <>
              {ind == 0 ? "" : " ,"}
              <div key={ind} className="text-base">
                {instructor[1]}
              </div>
            </>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddSectionCard;
