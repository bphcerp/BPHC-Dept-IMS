import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, FileImage } from "lucide-react";
import { useAuth } from "@/hooks/Auth";
import ProfileImageUploader from "@/components/shared/ProfileImageUploader";
import SignatureUploader from "@/components/profile/SignatureUploader";

const Profile = () => {
  const { authState } = useAuth();
  const userEmail = authState!.email;
  const userType = authState!.userType;

  return (
    <div className="max-w-2xl space-y-4 p-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Image
          </CardTitle>
          <p className="text-sm text-gray-600">
            Upload your profile image (displayed in your account)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileImageUploader email={userEmail} />
        </CardContent>
      </Card>

      {userType === "faculty" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Digital Signature
            </CardTitle>
            <p className="text-sm text-gray-600">
              Upload your digital signature for document signing
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <SignatureUploader userEmail={userEmail} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;
