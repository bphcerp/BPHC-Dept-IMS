import React, { useMemo, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload } from "lucide-react";

interface ProfileHeaderProps {
  name: string;
  email: string;
  designation?: string;
  department?: string;
  imageUrl: string | null;
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
  onImageChange?: (file: File) => void;
}

export const ProfileHeader = ({
  name,
  email,
  designation,
  department,
  imageUrl,
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
  onImageChange,
}: ProfileHeaderProps) => {
  const initials = useMemo(() => {
    const parts = name.trim().split(" ");
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  }, [name]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  return (
    <Card className="bg-background">
      <CardContent className="p-8">
        <div className="flex items-start gap-8">
          <div className="flex-shrink-0">
            <div className="relative h-32 w-32 rounded-lg border-2 border-muted-foreground/30 bg-muted/40 md:h-48 md:w-48 group">
              <Avatar className="h-full w-full rounded-lg">
                {imageUrl ? (
                  <AvatarImage src={imageUrl} alt={name} className="rounded-lg object-cover" />
                ) : null}
                <AvatarFallback className="rounded-lg text-muted-foreground">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setIsImageDialogOpen(true)}
                className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 cursor-pointer" onClick={() => setDetailsOpen(true)}>
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
            <p className="text-muted-foreground">{email}</p>
            <p className="text-sm text-muted-foreground">{designation || "—"}</p>
            <p className="text-sm text-muted-foreground">{department || "—"}</p>
          </div>
        </div>
        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="w-[600px] max-w-full h-[70vh] overflow-y-auto">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-2xl font-bold">Profile Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-base">
              <div><span className="font-semibold">Name:</span> {name}</div>
              <div><span className="font-semibold">Email:</span> {email}</div>
              <div><span className="font-semibold">Designation:</span> {designation || "—"}</div>
              <div><span className="font-semibold">Department:</span> {department || "—"}</div>
              {description && <div><span className="font-semibold">Description:</span> {description}</div>}
              {(education && education.length) && <div><span className="font-semibold">Education:</span> {education.join(", ")}</div>}
              {(researchInterests && researchInterests.length) && <div><span className="font-semibold">Research Interests:</span> {researchInterests.join(", ")}</div>}
              {(courses && courses.length) && <div><span className="font-semibold">Courses:</span> {courses.join(", ")}</div>}
              {linkedin && <div><span className="font-semibold">LinkedIn:</span> {linkedin}</div>}
              {orchidID && <div><span className="font-semibold">ORCID:</span> {orchidID}</div>}
              {scopusID && <div><span className="font-semibold">Scopus ID:</span> {scopusID}</div>}
              {googleScholar && <div><span className="font-semibold">Google Scholar:</span> {googleScholar}</div>}
              {(additionalLinks && additionalLinks.length) && <div><span className="font-semibold">Additional Links:</span> {additionalLinks.join(", ")}</div>}
            </div>
          </DialogContent>
        </Dialog>
            <div className="pt-2 flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="px-6">Edit profile</Button>
                </DialogTrigger>
            <DialogContent className="w-[700px] max-w-full h-[70vh] overflow-y-auto">
              <DialogHeader className="mb-2">
                <DialogTitle className="text-2xl font-bold">Edit your details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Name</label>
                  <Input value={name} readOnly disabled />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Email</label>
                  <Input value={email} readOnly disabled />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Phone</label>
                  <Input placeholder="Enter phone" value={editState.phone} onChange={(e) => setEditState((s) => ({ ...s, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Designation</label>
                  <Input value={editState.designation} onChange={(e) => setEditState((s) => ({ ...s, designation: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Department</label>
                  <Input value={editState.department} onChange={(e) => setEditState((s) => ({ ...s, department: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Description</label>
                  <Input value={editState.description} onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Education (comma-separated)</label>
                  <Input value={editState.education} onChange={(e) => setEditState((s) => ({ ...s, education: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Research interests (comma-separated)</label>
                  <Input value={editState.researchInterests} onChange={(e) => setEditState((s) => ({ ...s, researchInterests: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Courses (comma-separated)</label>
                  <Input value={editState.courses} onChange={(e) => setEditState((s) => ({ ...s, courses: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">LinkedIn</label>
                  <Input value={editState.linkedin} onChange={(e) => setEditState((s) => ({ ...s, linkedin: e.target.value }))} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">ORCID</label>
                    <Input value={editState.orchidID} onChange={(e) => setEditState((s) => ({ ...s, orchidID: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Scopus ID</label>
                    <Input value={editState.scopusID} onChange={(e) => setEditState((s) => ({ ...s, scopusID: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm">Google Scholar</label>
                  <Input value={editState.googleScholar} onChange={(e) => setEditState((s) => ({ ...s, googleScholar: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Additional links (comma-separated)</label>
                  <Input value={editState.additionalLinks} onChange={(e) => setEditState((s) => ({ ...s, additionalLinks: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    const payload: Record<string, unknown> = {};
                    if (editState.phone !== (phone ?? "")) payload.phone = editState.phone;
                    if (editState.description !== (description ?? "")) payload.description = editState.description;
                    if (editState.designation !== (designation ?? "")) payload.designation = editState.designation;
                    if (editState.department !== (department ?? "")) payload.department = editState.department;
                    const toArray = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
                    const eduArr = toArray(editState.education);
                    const riArr = toArray(editState.researchInterests);
                    const coursesArr = toArray(editState.courses);
                    const linksArr = toArray(editState.additionalLinks);
                    if (JSON.stringify(eduArr) !== JSON.stringify(education ?? [])) payload.education = eduArr;
                    if (JSON.stringify(riArr) !== JSON.stringify(researchInterests ?? [])) payload.researchInterests = riArr;
                    if (JSON.stringify(coursesArr) !== JSON.stringify(courses ?? [])) payload.courses = coursesArr;
                    if (editState.linkedin !== (linkedin ?? "")) payload.linkedin = editState.linkedin;
                    if (editState.orchidID !== (orchidID ?? "")) payload.orchidID = editState.orchidID;
                    if (editState.scopusID !== (scopusID ?? "")) payload.scopusID = editState.scopusID;
                    if (editState.googleScholar !== (googleScholar ?? "")) payload.googleScholar = editState.googleScholar;
                    if (JSON.stringify(linksArr) !== JSON.stringify(additionalLinks ?? [])) payload.additionalLinks = linksArr;
                    onEditProfile(payload);
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
              <Button
                variant="outline"
                onClick={() => setIsImageDialogOpen(true)}
                className="px-6"
              >
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
        </div>
      </CardContent>

      {/* Image Upload Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative h-32 w-32 rounded-lg border-2 border-muted-foreground/30 bg-muted/40">
                <Avatar className="h-full w-full rounded-lg">
                  {previewImage ? (
                    <AvatarImage src={previewImage} alt="Preview" className="rounded-lg object-cover" />
                  ) : imageUrl ? (
                    <AvatarImage src={imageUrl} alt={name} className="rounded-lg object-cover" />
                  ) : null}
                  <AvatarFallback className="rounded-lg text-muted-foreground">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-image">Choose a new profile picture</Label>
              <Input
                ref={fileInputRef}
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setPreviewImage(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="cursor-pointer"
              />
            </div>

            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setPreviewImage(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                if (selectedFile && onImageChange) {
                  onImageChange(selectedFile);
                  setIsImageDialogOpen(false);
                  setSelectedFile(null);
                  setPreviewImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }
              }}
              disabled={!selectedFile}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};