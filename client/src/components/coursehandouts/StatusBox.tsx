import { FC } from "react";

interface StatusBoxProps {
  message: string;
  status: "success" | "error";
}

export const StatusBox: FC<StatusBoxProps> = ({ message, status }) => {
  const bgColor = status === "success" ? "bg-green-100" : "bg-red-100";
  const textColor = status === "success" ? "text-green-800" : "text-red-800";

  return (
    <div className={`mb-4 p-4 ${bgColor} ${textColor} rounded`}>
      {message}
    </div>
  );
};
