import { useAuth } from "@/hooks/Auth";
import api from "@/lib/axios-instance";
import { LOGIN_ENDPOINT } from "@/lib/constants";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";

function Home() {
  const { authState, updateAuthState, logOut } = useAuth();

  const onSuccess = (credentialResponse: CredentialResponse) => {
    api
      .post<{ token: string }>(LOGIN_ENDPOINT, {
        token: credentialResponse.credential,
      })
      .then((response) => {
        updateAuthState(response.data.token);
      })
      .catch(() => {
        // notify login failed
      });
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      {!authState ? (
        <GoogleLogin onSuccess={onSuccess} />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="whitespace-pre text-left">
            {JSON.stringify(authState, null, 4)}
          </p>
          <button className="self-center" onClick={() => logOut()}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
