import { useAuth } from "react-oidc-context";
import './App.css'
import { useState } from "react";
import { getFileFromS3, putFileToS3 } from "./utils/utils";

function App() {
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("password");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const { user, isAuthenticated, isLoading, error, signinRedirect, removeUser } = useAuth();
  const userEmail = user?.id_token && JSON.parse(atob(user?.id_token?.split(".")[1]))?.email

  const signOutRedirect = () => {
    removeUser()
    const clientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
    const logoutUri = "http://localhost:5173";
    const cognitoDomain = import.meta.env.VITE_COGNITO_USER_POOL_DOMAIN;
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    console.log(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file to upload");
      return;
    }
    setUploading(true);
    const fileExt = file?.name?.split(".").slice(-1)[0];
    const fileName = btoa(userEmail) + secret + "." + fileExt;
    try {
      await putFileToS3(file, fileName, user?.id_token)
      setMessage(`File uploaded successfully!!! Secret to share is ${secret}-${fileExt}`);
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };


  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  return (
    <>
      <div className="header">
        {!isAuthenticated ?
          <button onClick={() => signinRedirect()}>Sign in</button>
          : <button onClick={() => signOutRedirect()}>Sign out</button>}

      </div>
      <div className="download-container">
        <div>
          <input type="text" placeholder="file owner's email" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="text" placeholder="secret-key" value={secret} onChange={e => setSecret(e.target.value)} />
        </div>
        <div>
          <button onClick={() => { getFileFromS3(`${btoa(email)}${secret?.split("-")[0]}.${secret?.split("-")[1]}`) }}>
            Download
          </button>
        </div>
      </div>
      {
        isAuthenticated && <div className="upload-container">
          <input type="text" value={userEmail} disabled={true} />
          <input type="text" placeholder="secret-key" value={secret} onChange={e => setSecret(e.target.value)} />
          <div>
            <h1>Upload File to S3</h1>
            <input type="file" accept=".txt" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
            {message && <p>{message}</p>}
          </div>
        </div>
      }
    </>
  );
}

export default App;