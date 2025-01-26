import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAddMember from "@/hooks/UseAddMember"; 
import { useAuth } from "@/hooks/Auth";

const AddMember = () => {
  const { authState } = useAuth(); 
  const navigate = useNavigate();
  

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");


  const { addMember, isLoading, error } = useAddMember();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !role) {
      return;
    }

    await addMember({ email, role });

    if (!isLoading && !error) {
      navigate("/"); 
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 border rounded-md shadow-md">
      <h1 className="text-xl font-semibold text-center">Add New Member</h1>
      {authState ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 p-2 border rounded w-full"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium">
              Role
            </label>
            <input
              type="text"
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="mt-1 p-2 border rounded w-full"
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading}
              className={`${
                isLoading ? "bg-gray-400" : "bg-blue-600"
              } text-white p-2 rounded-md w-full`}
            >
              {isLoading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center text-red-500">
          You must be logged in to add a member.
        </div>
      )}
    </div>
  );
};

export default AddMember;
