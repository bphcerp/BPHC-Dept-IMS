import {
  AllocationResponse,
  SectionClient,
} from "node_modules/lib/src/types/allocation";
import React from "react";
import { Card, CardContent, CardTitle } from "../ui/card";

interface AllocationSectionCardAddProps {
  section: SectionClient;
  number: number;
  allocatedSection?: never;
  sectionNumber?: never;
}

interface AllocationSectionCardViewProps {
  section?: never;
  number: number;
  allocatedSection: Exclude<AllocationResponse, null>["sections"][number];
}

type AllocationSectionCardProps =
  | AllocationSectionCardAddProps
  | AllocationSectionCardViewProps;

const AllocationSectionCard: React.FC<AllocationSectionCardProps> = ({
  section,
  number,
  allocatedSection,
}) => {
  return !allocatedSection ? (
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
  ) : (
    <Card className="pt-4">
      <CardContent className="flex flex-col gap-2">
        <CardTitle>{allocatedSection.type + " " + number}</CardTitle>
        <div className="flex flex-col">
          <ol className="list-decimal px-6">
            {allocatedSection.instructors.map((el, ind) => (
              <li key={ind} className="text-base">
                {el.name}
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default AllocationSectionCard;
