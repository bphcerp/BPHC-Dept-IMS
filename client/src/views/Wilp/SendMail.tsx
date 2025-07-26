import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/Auth";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

const DEFAULT_MAIL_BODY = `Dear Faculty/Staff,\n\nThis is a sample bulk mail for WILP projects.\n\n- You can use **Markdown** to format your message.\n- Add more details here as needed.\n\nBest regards,\nWILP Team`;

export default function SendMail() {
  const { authState, checkAccess } = useAuth();
  const [includeFaculty, setIncludeFaculty] = useState(true);
  const [additionalMailList, setAdditionalMailList] = useState("");
  const [subject, setSubject] = useState("");
  const [mailBody, setMailBody] = useState(DEFAULT_MAIL_BODY);
  const [sending, setSending] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("wilp:project:mail")) return <Navigate to="/404" replace />;

  const handleSend = async () => {
    if (!subject.trim() || !mailBody.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    if (!includeFaculty && !additionalMailList.trim()) {
      toast.error("Please select at least one recipient");
      return;
    }
    setSending(true);
    try {
      const emails = additionalMailList
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);
      await api.post("/wilpProject/mail/bulk", {
        subject,
        text: mailBody,
        includeFaculty,
        additionalMailList: emails,
      });
      toast.success("Mail sent successfully");
      setSubject("");
      setMailBody(DEFAULT_MAIL_BODY);
      setAdditionalMailList("");
    } catch (err) {
      let errorMsg = "Failed to send mail";
      if (err && typeof err === "object") {
        const maybeAxiosErr = err as { response?: { data?: { message?: string; error?: string } } };
        if (maybeAxiosErr.response?.data?.message) {
          errorMsg = maybeAxiosErr.response.data.message;
        } else if (maybeAxiosErr.response?.data?.error) {
          errorMsg = maybeAxiosErr.response.data.error;
        } else if ((err as Error).message) {
          errorMsg = (err as Error).message;
        }
      }
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-screen h-screen min-h-0 min-w-0 bg-background-faded flex flex-col p-0">
      <div className="w-full h-full bg-white flex flex-col gap-6 p-8">
        <h2 className="text-3xl font-bold mb-4">WILP Bulk Mail</h2>
        <div className="flex items-center gap-3">
          <Checkbox
            checked={includeFaculty}
            onCheckedChange={(checked: boolean) => setIncludeFaculty(Boolean(checked))}
            id="faculty-checkbox"
          />
          <label htmlFor="faculty-checkbox" className="text-base select-none">
            Mail all Faculty
          </label>
        </div>
        <div>
          <label className="block text-base font-medium mb-1">Additional Emails (comma separated)</label>
          <Input
            type="text"
            value={additionalMailList}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdditionalMailList(e.target.value)}
            placeholder="e.g. user1@example.com, user2@example.com"
            className="h-11 text-base"
          />
        </div>
        <div>
          <label className="block text-base font-medium mb-1">Subject</label>
          <Input
            type="text"
            value={subject}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
            placeholder="Enter subject"
            className="h-11 text-base"
          />
        </div>
        <div className="flex flex-row items-center gap-4">
          <span className="block text-base font-medium">Mail Body</span>
          <Button type="button" variant="outline" onClick={() => setEditorOpen(true)}>
            Draft Mail
          </Button>
        </div>
        <Button
          onClick={() => void handleSend()}
          disabled={sending}
          className="w-full h-12 text-lg mt-2"
        >
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
      <Dialog open={editorOpen} onOpenChange={setEditorOpen} modal>
        <DialogContent className="w-screen h-screen p-0">
          <DialogHeader>
            <DialogTitle>Edit Mail Body</DialogTitle>
            <DialogDescription>Compose and preview your mail in markdown.</DialogDescription>
          </DialogHeader>
          <div className="py-2 h-[calc(100vh-160px)]">
            <Suspense fallback={<div className="w-full text-center">Loading editor...</div>}>
              <MDEditor
                value={mailBody}
                onChange={v => setMailBody(v ?? "")}
                height={window.innerHeight ? window.innerHeight - 220 : 400}
                preview="live"
                commandsFilter={(command) => command.name !== "fullscreen" ? command : false}
                style={{ minHeight: 300, height: '100%' }}
              />
            </Suspense>
          </div>
          <Button className="mt-2" onClick={() => setEditorOpen(false)}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
