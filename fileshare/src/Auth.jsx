import React from 'react'
import { useEffect } from 'react';
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router";
import { getId } from './utils/utils';

const Auth = () => {
    const { isAuthenticated, user } = useAuth();
    let navigate = useNavigate();
    useEffect(() => {
        const fetchIdentityId = async () => {
            await getId(user?.id_token);
            navigate("/");
        }
        if (isAuthenticated) fetchIdentityId();
    })
    return (
        <div style={{ display: 'flex', width: '100vh', justifyContent: 'center' }}>Authenticating...</div>
    )
}

export default Auth