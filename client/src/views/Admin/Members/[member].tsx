import { useParams } from "react-router-dom";

const MemberDetailsView = () => {
  const params = useParams();
  return (
    <div className="mx-auto flex max-w-5xl flex-1 flex-col gap-4 p-4">
      <h1 className="text-3xl font-bold text-primary">Member details</h1>
      <p>{params["member"]}</p>
    </div>
  );
};

export default MemberDetailsView;
