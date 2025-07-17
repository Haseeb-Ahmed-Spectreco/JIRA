import { NotImplemented } from "@/components/not-implemented";
import { ChildrenTreeIcon } from "@/components/svgs";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { BiLink } from "react-icons/bi";
import { BsThreeDots } from "react-icons/bs";
import { CgAttachment } from "react-icons/cg";
import { useRef, useState } from "react";
import { uploadToS3 } from "@/utils/uploadToS3";

interface AttachmentUpload {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  url?: string;
  error?: string;
}

interface IssueDetailsInfoActionsProps {
  onAddChildIssue: () => void;
  onAttachmentsUploaded?: (
    attachments: { url: string; name: string; size: number }[]
  ) => void;
  issueId?: string;
  variant?: "sm" | "lg";
}

const IssueDetailsInfoActions: React.FC<IssueDetailsInfoActionsProps> = ({
  onAddChildIssue,
  onAttachmentsUploaded,
  variant = "sm",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<AttachmentUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileArray = Array.from(files);

    // Initialize upload states
    const initialUploads: AttachmentUpload[] = fileArray.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploads(initialUploads);

    const uploadPromises = fileArray.map(async (file, index) => {
      try {
        // Update progress to show upload starting
        setUploads((prev) =>
          prev.map((upload, i) =>
            i === index ? { ...upload, progress: 10 } : upload
          )
        );

        // Use your uploadToS3 function with callbacks and return promise
        const result = await uploadToS3(
          file,
          (url: string) => {
            // Success callback - update progress to 100%
            setUploads((prev) =>
              prev.map((upload, i) =>
                i === index
                  ? {
                      ...upload,
                      status: "success",
                      url: url,
                      progress: 100,
                    }
                  : upload
              )
            );
          },
          (error: Error) => {
            // Error callback
            setUploads((prev) =>
              prev.map((upload, i) =>
                i === index
                  ? {
                      ...upload,
                      status: "error",
                      error: error.message,
                    }
                  : upload
              )
            );
          }
        );

        // Update progress during upload
        setUploads((prev) =>
          prev.map((upload, i) =>
            i === index ? { ...upload, progress: 90 } : upload
          )
        );

        if (result.success && result.url) {
          return {
            url: result.url,
            name: file.name,
            size: file.size,
          };
        } else {
          return null;
        }
      } catch (error) {
        setUploads((prev) =>
          prev.map((upload, i) =>
            i === index
              ? {
                  ...upload,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : upload
          )
        );
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(
      (result): result is NonNullable<typeof result> => result !== null
    );

    console.log("Successfully Uploaded", successfulUploads);

    if (successfulUploads.length > 0 && onAttachmentsUploaded) {
      onAttachmentsUploaded(successfulUploads);
    }

    setIsUploading(false);

    // Reset the input
    event.target.value = "";
  };

  const getButtonContent = () => {
    if (isUploading) {
      const uploadingCount = uploads.filter(
        (u) => u.status === "uploading"
      ).length;
      return variant === "sm" ? null : `Uploading ${uploadingCount}...`;
    }
    return variant === "sm" ? null : "Attach";
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-x-2 text-gray-700">
        <TooltipWrapper text="Add Attachments">
          <Button
            onClick={handleAttachmentClick}
            disabled={isUploading}
            customColors
            className="flex items-center whitespace-nowrap bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <CgAttachment className="rotate-45 text-xl" />
            <span
              data-state={variant === "sm" ? "sm" : "lg"}
              className="whitespace-nowrap text-sm font-medium [&[data-state=lg]]:ml-2"
            >
              {getButtonContent()}
            </span>
          </Button>
        </TooltipWrapper>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFileChange(e);
          }}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        <TooltipWrapper text="Add child issue">
          <Button
            onClick={onAddChildIssue}
            customColors
            className="flex items-center whitespace-nowrap bg-gray-100 hover:bg-gray-200"
          >
            <ChildrenTreeIcon />
            <span
              data-state={variant === "sm" ? "sm" : "lg"}
              className="whitespace-nowrap text-sm font-medium [&[data-state=lg]]:ml-2"
            >
              {variant === "sm" ? null : "Add a child issue"}
            </span>
          </Button>
        </TooltipWrapper>

        <NotImplemented feature="link">
          <Button
            customColors
            className="flex items-center whitespace-nowrap bg-gray-100 hover:bg-gray-200"
          >
            <BiLink className="text-xl" />
            <span
              data-state={variant === "sm" ? "sm" : "lg"}
              className="whitespace-nowrap text-sm font-medium [&[data-state=lg]]:ml-2"
            >
              {variant === "sm" ? null : "Link issue"}
            </span>
          </Button>
        </NotImplemented>

        <NotImplemented feature="add apps">
          <Button
            customColors
            className="flex items-center whitespace-nowrap bg-gray-100 hover:bg-gray-200"
          >
            <BsThreeDots className="text-xl" />
          </Button>
        </NotImplemented>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="max-w-[200px] truncate">{upload.file.name}</span>
              {upload.status === "uploading" && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {upload.progress}%
                  </span>
                </div>
              )}
              {upload.status === "success" && (
                <span className="text-xs text-green-600">✓ Uploaded</span>
              )}
              {upload.status === "error" && (
                <span className="text-xs text-red-600">✗ {upload.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { IssueDetailsInfoActions };
