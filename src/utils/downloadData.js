import { InvokeCommand, LambdaClient, LogType } from "@aws-sdk/client-lambda";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";



const bucketName = "aws-cbica-bridgeport-gwas"; // Uncomment this and comment the below line for the actual bucket
//const bucketName = "cbica-bridgeport-dummy-gwas";
const bucketParams = {
    Bucket: bucketName
};

const getCredentials = async () => {
    try {
        const creds = fromCognitoIdentityPool({
            identityPoolId: "us-east-1:25ed0935-4719-46aa-b7e7-b7ade3185246",
            clientConfig: { region: "us-east-1" },
        });
        return creds;
    }
    catch (error) {

        console.error("Error in getCredentials: ", error);
        return;
    }
}

const credentials = await getCredentials();
console.log("Credentials: ", credentials)
const s3 = new S3Client({ region: "us-east-1", credentials });
const lambda = new LambdaClient({ region: "us-east-1", credentials });


export const listFilesInBucket = async (prefix="") => {
    console.log("Reading bucket contents");
    var listing = [];
    try {
        var command;
        var response;
        if (prefix.length === 0) {
            command = new ListObjectsV2Command({Bucket: bucketName})
            response = await s3.send(command);
        }
        else {
            command = new ListObjectsV2Command({Bucket: bucketName, Prefix: prefix})
            response = await s3.send(command);
        }

        var contents = response.Contents;
        listing = listing.concat(contents)
        
        while (response.IsTruncated) {
            const input_n = {Bucket: bucketName, Prefix: prefix, ContinuationToken: response.NextContinuationToken};
            const command_n = new ListObjectsV2Command(input_n);
            response = await s3.send(command_n);
            listing = listing.concat(response.Contents)
        }
        
    }
    catch (error) {
        console.error("Error in listFilesInBucket: ", error)
    }
    finally {
        console.log("Exiting bucket listing", listing)
        return listing;
    }
    
}

const getKeyContents = async (key) => {
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key, 
    })
    try {
        const response = await s3.send(command);
        console.log(response.Body)
        return response.Body;
    }
    catch (error) {
        console.error("Error while getting file data from S3:", error);
    }
}

function saveBlobToFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    const clickHandler = () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.removeEventListener('click', clickHandler);
      }, 150);
    };
    a.addEventListener('click', clickHandler, false);
    a.click();
    return a;
  }

const downloadKeyToFile = async (key, index, setCurrentFileCallback) => {
    
    const fileData = await getKeyContents(key);
    setCurrentFileCallback(n => n + 1);
    const blob = new Blob([await fileData.transformToByteArray()]);
    const defaultFileName = key;
    saveBlobToFile(blob, defaultFileName);
    return;
}

const invokeLambda = async (funcName, payload) => {
    const client = lambda;
    const command = new InvokeCommand({
      FunctionName: funcName,
      Payload: JSON.stringify(payload),
      LogType: LogType.Tail,
    });
  
    const { Payload, LogResult } = await client.send(command);
    return;
    //const result = Buffer.from(Payload).toString();
    //const logs = Buffer.from(LogResult, "base64").toString();
    //return { logs, result };
  };
  
  

export const downloadMusicParcel = async (parcel, email="") => {
    const url = "/bridgeport/data/MuSIC/" + parcel + ".nii.gz"
    const fileName = "MuSIC_" + parcel + ".nii.gz"
    const payload = {downloadType: "MuSIC_" + parcel, email: email}
    fetch(url, { method: "get", mode: "no-cors", referrerPolicy: "no-referrer" })
    .then((res) => res.blob())
    .then((res) => {
      const aElement = document.createElement("a");
      aElement.setAttribute("download", fileName);
      const href = URL.createObjectURL(res);
      aElement.href = href;
      aElement.setAttribute("target", "_blank");
      aElement.click();
      URL.revokeObjectURL(href);
    })
    .then((res) => invokeLambda("cbica-bridgeport-incrementdownloads", payload));
}

export const downloadPSCByID = async (psc_id) => {
    // Takes a PSC_ID in the form "C32_123"
    const set = psc_id.split("_")[0];
    const psc = psc_id.split("_")[1];

    const key = set + "_" + psc + "_gwas_plink.tsv.zip";
    await downloadKeyToFile(key);
} 

const downloadKeyToBlob = async (key) => {
    return await getKeyContents(key);
}

export const downloadSet = async (set, setTotalFilesCallback, setCurrentFileCallback, email) => {
    const payload = {downloadType: "GWAS_" + set, email: email}
    const listing = await listFilesInBucket(set);
    setTotalFilesCallback(listing.length);
    let promises = [];
    for (let [index, item] of listing.entries()) {
        promises.push(downloadKeyToFile(item.Key, index, setCurrentFileCallback));
    }
    invokeLambda("cbica-bridgeport-incrementdownloads", payload)
    await Promise.all(promises);
}

const downloadData = async (set, psc) => {
    return;
}

export default downloadData;