import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const awsRegion = process.env.NEXT_PUBLIC_AWS_REGION;
const awsAccessKeyId = process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY;

if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey) {
  throw new Error("Missing required AWS configuration in environment variables");
}

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
});

// Type definitions
interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

type OnUploadSuccess = (url: string) => void;
type OnUploadError = (error: Error) => void;

export const uploadToS3 = async (
  file: File,
  onUploadSuccess?: OnUploadSuccess,
  onUploadError?: OnUploadError
): Promise<UploadResult> => {
  if (!file) {
    const error = new Error("No file provided");
    if (onUploadError) onUploadError(error);
    return { success: false, error: error.message };
  }

  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
  if (!bucketName) {
    const error = new Error("AWS S3 Bucket name is missing");
    console.error(error.message);
    if (onUploadError) onUploadError(error);
    return { success: false, error: error.message };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileName = `uploads/${Date.now()}-${file.name}`;

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: uint8Array,
      ContentType: file.type,
    };

    console.log("Uploading with params:", params);

    await s3Client.send(new PutObjectCommand(params));

    const region = process.env.NEXT_PUBLIC_AWS_REGION ?? "";
    if (!region) {
      const error = new Error("AWS region is missing");
      console.error(error.message);
      if (onUploadError) onUploadError(error);
      return { success: false, error: error.message };
    }
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    console.log("File URL:", fileUrl);

    if (onUploadSuccess) onUploadSuccess(fileUrl);
    
    return { success: true, url: fileUrl };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown upload error";
    const uploadError = error instanceof Error ? error : new Error(errorMessage);
    
    if (onUploadError) onUploadError(uploadError);
    
    return { success: false, error: errorMessage };
  }
};

// Alternative version with better type safety for environment variables
export const uploadToS3Safe = async (
  file: File,
  onUploadSuccess?: OnUploadSuccess,
  onUploadError?: OnUploadError
): Promise<UploadResult> => {
  // Validate environment variables
  const region = process.env.NEXT_PUBLIC_AWS_REGION;
  const accessKeyId = process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY;
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;

  if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
    const error = new Error("Missing required AWS configuration");
    console.error("Missing AWS env vars:", { region, accessKeyId, secretAccessKey, bucketName });
    if (onUploadError) onUploadError(error);
    return { success: false, error: error.message };
  }

  if (!file) {
    const error = new Error("No file provided");
    if (onUploadError) onUploadError(error);
    return { success: false, error: error.message };
  }

  try {
    const s3ClientSafe = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileName = `uploads/${Date.now()}-${file.name}`;

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: uint8Array,
      ContentType: file.type,
    };

    console.log("Uploading with params:", params);

    await s3ClientSafe.send(new PutObjectCommand(params));

    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    console.log("File URL:", fileUrl);

    if (onUploadSuccess) onUploadSuccess(fileUrl);
    
    return { success: true, url: fileUrl };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown upload error";
    const uploadError = error instanceof Error ? error : new Error(errorMessage);
    
    if (onUploadError) onUploadError(uploadError);
    
    return { success: false, error: errorMessage };
  }
};