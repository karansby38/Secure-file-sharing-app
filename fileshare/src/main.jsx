import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from "react-oidc-context";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import Auth from './Auth.jsx';

const awsRegion = import.meta.env.VITE_AWS_REGION;
const congitoUserPoolID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const congitoUserPoolClientID = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;

const cognitoAuthConfig = {
  authority: `https://cognito-idp.${awsRegion}.amazonaws.com/${congitoUserPoolID}`,
  client_id: congitoUserPoolClientID,
  redirect_uri: "http://localhost:5173/auth",
  response_type: "code",
  scope: "phone openid email",
};

const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </Router>
    </AuthProvider>
  </StrictMode>
);