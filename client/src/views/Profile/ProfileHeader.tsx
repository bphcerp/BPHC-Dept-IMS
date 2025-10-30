import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, User } from "lucide-react";
import ProfileImageUploader from "@/components/shared/ProfileImageUploader";
import SignatureUploader from "@/components/profile/SignatureUploader";
import { adminSchemas } from "lib";

interface ProfileHeaderProps {
  name: string;
  email: string;
  type: (typeof adminSchemas.userTypes)[number];
  designation?: string;
  department?: string;
  description?: string | null;
  education?: string[] | null;
  researchInterests?: string[] | null;
  courses?: string[] | null;
  linkedin?: string | null;
  orchidID?: string | null;
  scopusID?: string | null;
  googleScholar?: string | null;
  additionalLinks?: string[] | null;
  phone?: string | null;
  onEditProfile: (data: Record<string, unknown>) => void;
}

export const ProfileHeader = ({
  name,
  email,
  type,
  designation,
  department,
  description,
  education,
  researchInterests,
  courses,
  linkedin,
  orchidID,
  scopusID,
  googleScholar,
  additionalLinks,
  phone,
  onEditProfile,
}: ProfileHeaderProps) => {
  const [editState, setEditState] = useState<{
    phone: string;
    description: string;
    designation: string;
    department: string;
    education: string;
    researchInterests: string;
    courses: string;
    linkedin: string;
    orchidID: string;
    scopusID: string;
    googleScholar: string;
    additionalLinks: string;
  }>({
    phone: phone ?? "",
    description: description ?? "",
    designation: designation ?? "",
    department: department ?? "",
    education: (education ?? []).join(", "),
    researchInterests: (researchInterests ?? []).join(", "),
    courses: (courses ?? []).join(", "),
    linkedin: linkedin ?? "",
    orchidID: orchidID ?? "",
    scopusID: scopusID ?? "",
    googleScholar: googleScholar ?? "",
    additionalLinks: (additionalLinks ?? []).join(", "),
  });

  const [detailsOpen, setDetailsOpen] = useState(false);

  const toArray = useCallback(
    (v: string) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    []
  );

  return (
    <Card className="bg-background">
      <CardContent className="p-8">
        <div className="flex flex-col gap-8">
          <div className="flex gap-4 max-lg:flex-col">
            <Card className="max-w-5xl flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileImageUploader email={email} />
              </CardContent>
            </Card>
            {type === "faculty" && (
              <Card className="max-w-5xl flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Signature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SignatureUploader userEmail={email} />
                </CardContent>
              </Card>
            )}
          </div>

          <div
            className="flex-1 cursor-pointer space-y-3"
            onClick={() => setDetailsOpen(true)}
          >
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
            <p className="text-muted-foreground">{email}</p>
            <p className="text-sm text-muted-foreground">
              {designation || "—"}
            </p>
            <p className="text-sm text-muted-foreground">{department || "—"}</p>
          </div>
        </div>
        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="h-[70vh] w-[600px] max-w-full overflow-y-auto">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-2xl font-bold">
                Profile Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-base">
              <div>
                <span className="font-semibold">Name:</span> {name}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {email}
              </div>
              <div>
                <span className="font-semibold">Designation:</span>{" "}
                {designation || "—"}
              </div>
              <div>
                <span className="font-semibold">Department:</span>{" "}
                {department || "—"}
              </div>
              {description && (
                <div>
                  <span className="font-semibold">Description:</span>{" "}
                  {description}
                </div>
              )}
              {education && education.length && (
                <div>
                  <span className="font-semibold">Education:</span>{" "}
                  {education.join(", ")}
                </div>
              )}
              {researchInterests && researchInterests.length && (
                <div>
                  <span className="font-semibold">Research Interests:</span>{" "}
                  {researchInterests.join(", ")}
                </div>
              )}
              {courses?.length && (
                <div>
                  <span className="font-semibold">Courses:</span>{" "}
                  {courses.join(", ")}
                </div>
              )}{" "}
              {linkedin && (
                <div>
                  <span className="font-semibold">LinkedIn:</span> {linkedin}
                </div>
              )}
              {orchidID && (
                <div>
                  <span className="font-semibold">ORCID:</span> {orchidID}
                </div>
              )}
              {scopusID && (
                <div>
                  <span className="font-semibold">Scopus ID:</span> {scopusID}
                </div>
              )}
              {googleScholar && (
                <div>
                  <span className="font-semibold">Google Scholar:</span>{" "}
                  {googleScholar}
                </div>
              )}
              {additionalLinks?.length && (
                <div>
                  <span className="font-semibold">Additional Links:</span>{" "}
                  {additionalLinks.join(", ")}
                </div>
              )}{" "}
            </div>
          </DialogContent>
        </Dialog>
        <div className="flex gap-3 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="px-6">
                Edit profile
              </Button>
            </DialogTrigger>
            <DialogContent className="h-[70vh] w-[700px] max-w-full overflow-y-auto">
              <DialogHeader className="mb-2">
                <DialogTitle className="text-2xl font-bold">
                  Edit your details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Name
                  </label>
                  <Input value={name} readOnly disabled />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Email
                  </label>
                  <Input value={email} readOnly disabled />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Phone</label>
                  <Input
                    placeholder="Enter phone"
                    value={editState.phone}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, phone: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Designation</label>
                  <Input
                    value={editState.designation}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        designation: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Department</label>
                  <Input
                    value={editState.department}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        department: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Description</label>
                  <Input
                    value={editState.description}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">
                    Education (comma-separated)
                  </label>
                  <Input
                    value={editState.education}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, education: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">
                    Research interests (comma-separated)
                  </label>
                  <Input
                    value={editState.researchInterests}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        researchInterests: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">
                    Courses (comma-separated)
                  </label>
                  <Input
                    value={editState.courses}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, courses: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">LinkedIn</label>
                  <Input
                    value={editState.linkedin}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, linkedin: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">ORCID</label>
                    <Input
                      value={editState.orchidID}
                      onChange={(e) =>
                        setEditState((s) => ({
                          ...s,
                          orchidID: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Scopus ID</label>
                    <Input
                      value={editState.scopusID}
                      onChange={(e) =>
                        setEditState((s) => ({
                          ...s,
                          scopusID: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm">Google Scholar</label>
                  <Input
                    value={editState.googleScholar}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        googleScholar: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">
                    Additional links (comma-separated)
                  </label>
                  <Input
                    value={editState.additionalLinks}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        additionalLinks: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    const payload: Record<string, unknown> = {};
                    if (editState.phone !== (phone ?? ""))
                      payload.phone = editState.phone;
                    if (editState.description !== (description ?? ""))
                      payload.description = editState.description;
                    if (editState.designation !== (designation ?? ""))
                      payload.designation = editState.designation;
                    if (editState.department !== (department ?? ""))
                      payload.department = editState.department;
                    const eduArr = toArray(editState.education);
                    const riArr = toArray(editState.researchInterests);
                    const coursesArr = toArray(editState.courses);
                    const linksArr = toArray(editState.additionalLinks);
                    if (
                      JSON.stringify(eduArr) !== JSON.stringify(education ?? [])
                    )
                      payload.education = eduArr;
                    if (
                      JSON.stringify(riArr) !==
                      JSON.stringify(researchInterests ?? [])
                    )
                      payload.researchInterests = riArr;
                    if (
                      JSON.stringify(coursesArr) !==
                      JSON.stringify(courses ?? [])
                    )
                      payload.courses = coursesArr;
                    if (editState.linkedin !== (linkedin ?? ""))
                      payload.linkedin = editState.linkedin;
                    if (editState.orchidID !== (orchidID ?? ""))
                      payload.orchidID = editState.orchidID;
                    if (editState.scopusID !== (scopusID ?? ""))
                      payload.scopusID = editState.scopusID;
                    if (editState.googleScholar !== (googleScholar ?? ""))
                      payload.googleScholar = editState.googleScholar;
                    if (
                      JSON.stringify(linksArr) !==
                      JSON.stringify(additionalLinks ?? [])
                    )
                      payload.additionalLinks = linksArr;
                    onEditProfile(payload);
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
