import { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } from "@aws-sdk/client-cognito-identity";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const identityPoolId = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;
const awsRegion = import.meta.env.VITE_AWS_REGION;
const congitoUserPoolID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const s3BucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME;

const config = { region: import.meta.env.VITE_AWS_REGION }
const userPool = `cognito-idp.${awsRegion}.amazonaws.com/${congitoUserPoolID}`;

const cognitoClient = new CognitoIdentityClient(config);

const getId = async (idToken) => {
    const input = {
        IdentityPoolId: identityPoolId,
        ...(idToken && {
            Logins: {
                [userPool]: idToken
            }
        })
    };
    const command = new GetIdCommand(input);
    const response = await cognitoClient.send(command);
    console.log(response);
    localStorage.setItem("identityId", response?.IdentityId);
    return response?.IdentityId
}


const getIAMCreds = async (idToken) => {
    const identityId = localStorage.getItem("identityId") || await getId(idToken || false);

    const session = JSON.parse(sessionStorage.getItem(identityId));
    if (session && session.exp > Date.now()) {
        console.log("IAM Creds  still valid");
        return session.credentials
    }
    console.log("downloading IAM creds");
    const input = {
        IdentityId: identityId,
        ...(idToken && {
            Logins: {
                [userPool]: idToken
            }
        })
    };
    const command = new GetCredentialsForIdentityCommand(input);
    const response = await cognitoClient.send(command);
    console.log("downloaded IAM creds");
    console.log(response);

    const credentials = {
        accessKeyId: response.Credentials.AccessKeyId,
        secretAccessKey: response.Credentials.SecretKey,
        sessionToken: response.Credentials.SessionToken,
    }

    sessionStorage.setItem(identityId, JSON.stringify({ credentials, exp: (new Date(response?.Credentials?.Expiration)).getTime() }));
    return credentials;
}

const getFileFromS3 = async (key, idToken) => {
    console.log("Downloading ", key);
    const config = { region: import.meta.env.VITE_AWS_REGION }
    config.credentials = await getIAMCreds(idToken);
    const s3Client = new S3Client(config);
    const input = {
        Bucket: s3BucketName,
        Key: key,
    };
    const command = new GetObjectCommand(input);
    const response = await s3Client.send(command);
    console.log(response);

    const stream = response.Body;

    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    const blob = new Blob(chunks);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = key;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

const putFileToS3 = async (file, fileName, idToken) => {
    const config = { region: import.meta.env.VITE_AWS_REGION, requestChecksumCalculation: "WHEN_REQUIRED" }
    config.credentials = await getIAMCreds(idToken);
    const s3Client = new S3Client(config);
    const input = {
        Bucket: s3BucketName,
        Key: fileName,
        Body: file,
        ContentType: file.type,
    };
    const command = new PutObjectCommand(input);
    const response = await s3Client.send(command);
    console.log(response);
    return response.$metadata.httpStatusCode === 200;
}

export { getId, getIAMCreds, getFileFromS3, putFileToS3 };