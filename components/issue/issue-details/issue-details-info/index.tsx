import React, { Fragment, useRef, useState } from "react";
import { NotImplemented } from "@/components/not-implemented";
import { LightningIcon } from "@/components/svgs";
import { IssueTitle } from "../../issue-title";
import { IssueSelectStatus } from "../../issue-select-status";
import { useSelectedIssueContext } from "@/context/use-selected-issue-context";
import { type IssueType } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { Comments } from "./issue-details-info-comments";
import { IssueMetaInfo } from "./issue-details-info-meta";
import { Description } from "./issue-details-info-description";
import { IssueDetailsInfoAccordion } from "./issue-details-info-accordion";
import { IssueDetailsInfoActions } from "./issue-details-info-actions";
import { ChildIssueList } from "./issue-details-info-child-issues";
import { hasChildren, isEpic } from "@/utils/helpers";
import { ColorPicker } from "@/components/color-picker";
import { useContainerWidth } from "@/hooks/use-container-width";
import { useIssues } from "@/hooks/query-hooks/use-issues";
import Split from "react-split";
import Image from "next/image";
import "@/styles/split.css";

const IssueDetailsInfo = React.forwardRef<
  HTMLDivElement,
  { issue: IssueType | undefined }
>(({ issue }, ref) => {
  const [parentRef, parentWidth] = useContainerWidth();

  if (!issue) return <div />;
  return (
    <div ref={parentRef}>
      {!parentWidth ? null : parentWidth > 800 ? (
        <LargeIssueDetails issue={issue} ref={ref} />
      ) : (
        <SmallIssueDetailsInfo issue={issue} ref={ref} />
      )}
    </div>
  );
});

IssueDetailsInfo.displayName = "IssueDetailsInfo";

const ImageAttachment = ({
  imageUrl,
  alt = "Issue attachment",
}: {
  imageUrl: string;
  alt?: string;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const openFullImage = () => {
    setShowFullImage(true);
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  };

  const closeFullImage = () => {
    setShowFullImage(false);
    document.body.style.overflow = "unset"; // Restore scrolling
  };

  // Close modal on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFullImage) {
        closeFullImage();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showFullImage]);

  if (hasError) {
    return (
      <div className="mb-3 flex w-fit items-center justify-center rounded-md border border-red-200 bg-red-50 p-3">
        <div className="text-center">
          <div className="mb-1 text-sm text-red-400">⚠️</div>
          <p className="text-xs text-red-600">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="group relative mb-3 w-fit cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={openFullImage}
      >
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 flex min-h-[80px] min-w-[120px] animate-pulse items-center justify-center rounded-md bg-gray-100">
            <div className="text-xs text-gray-400">Loading...</div>
          </div>
        )}

        {/* Small image container */}
        <div
          className={`
          relative mt-2 overflow-hidden rounded-md border border-gray-200 bg-white
          shadow-sm transition-all duration-200 ease-in-out
          ${isHovered ? "scale-105 border-gray-300 shadow-md" : ""}
        `}
        >
          <Image
            src={imageUrl}
            alt={alt}
            width={150}
            height={100}
            className={`
              h-auto max-h-[100px] w-auto max-w-[150px] object-cover transition-opacity duration-300
              ${isLoading ? "opacity-0" : "opacity-100"}
            `}
            onLoad={handleLoad}
            onError={handleError}
            unoptimized
            priority
          />

          {/* Subtle overlay on hover */}
          {isHovered && (
            <div className="absolute inset-0 bg-black bg-opacity-10 transition-opacity duration-200" />
          )}
        </div>

        {/* Expand icon on hover */}
        {isHovered && (
          <div className="absolute right-1 top-1 flex items-center rounded bg-black bg-opacity-60 px-1.5 py-0.5 text-xs text-white opacity-90">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15,3 21,3 21,9"></polyline>
              <polyline points="9,21 3,21 3,15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </div>
        )}
      </div>

      {/* Full Image Modal - Full page overlay */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-95"
          onClick={closeFullImage}
        >
          {/* Close button */}
          <button
            onClick={closeFullImage}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white bg-opacity-20 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-opacity-30"
            aria-label="Close full image"
          >
            ✕
          </button>

          {/* Full page image */}
          <div className="flex h-full w-full items-center justify-center p-4">
            <Image
              src={imageUrl}
              alt={alt}
              width={1920}
              height={1080}
              className="max-h-full max-w-full object-contain"
              unoptimized
              priority
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 transform rounded-full bg-black bg-opacity-60 px-4 py-2 text-sm text-white backdrop-blur-sm">
            Click anywhere or press ESC to close
          </div>
        </div>
      )}
    </>
  );
};

const SmallIssueDetailsInfo = React.forwardRef<
  HTMLDivElement,
  { issue: IssueType }
>(({ issue }, ref) => {
  const { issueKey } = useSelectedIssueContext();
  const { updateIssue } = useIssues();
  const nameRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingChildIssue, setIsAddingChildIssue] = useState(false);

  const handleAttachmentsUploaded = (
    attachments: { url: string; name: string; size: number }[]
  ) => {
    console.log("Adding Attachment", attachments);

    // Take only the first attachment and use its URL as imageUrl
    if (attachments.length > 0) {
      const firstAttachment = attachments[0];
      updateIssue({
        issueId: issue.id,
        imageUrl: firstAttachment?.url ?? undefined,
      });
    }
  };

  return (
    <Fragment>
      <div className="flex items-center gap-x-2">
        {isEpic(issue) ? <ColorPicker issue={issue} /> : null}
        <h1
          ref={ref}
          role="button"
          onClick={() => setIsEditing(true)}
          data-state={isEditing ? "editing" : "notEditing"}
          className="w-full transition-all [&[data-state=notEditing]]:hover:bg-gray-100"
        >
          <IssueTitle
            className="mr-1 py-1"
            key={issue.id + issue.name}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            issue={issue}
            ref={nameRef}
          />
        </h1>
      </div>

      <IssueDetailsInfoActions
        onAddChildIssue={() => setIsAddingChildIssue(true)}
        onAttachmentsUploaded={handleAttachmentsUploaded}
      />
      <div className="relative flex items-center gap-x-3">
        <IssueSelectStatus
          key={issue.id + issue.status}
          currentStatus={issue.status}
          issueId={issue.id}
          variant="lg"
        />
        <NotImplemented>
          <Button customColors className="hover:bg-gray-200">
            <div className="flex items-center">
              <LightningIcon className="mt-0.5" />
              <span>Actions</span>
            </div>
          </Button>
        </NotImplemented>
      </div>

      {/* Enhanced Image Display */}
      {issue.imageUrl && (
        <ImageAttachment imageUrl={issue.imageUrl} alt="Issue attachment" />
      )}

      <Description issue={issue} key={String(issueKey) + issue.id} />
      {hasChildren(issue) || isAddingChildIssue ? (
        <ChildIssueList
          issues={issue.children}
          parentIsEpic={isEpic(issue)}
          parentId={issue.id}
          isAddingChildIssue={isAddingChildIssue}
          setIsAddingChildIssue={setIsAddingChildIssue}
        />
      ) : null}
      <IssueDetailsInfoAccordion issue={issue} />
      <IssueMetaInfo issue={issue} />
      <Comments issue={issue} />
    </Fragment>
  );
});

SmallIssueDetailsInfo.displayName = "SmallIssueDetailsInfo";

const LargeIssueDetails = React.forwardRef<
  HTMLDivElement,
  { issue: IssueType }
>(({ issue }, ref) => {
  const { issueKey } = useSelectedIssueContext();
  const { updateIssue } = useIssues();
  const nameRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingChildIssue, setIsAddingChildIssue] = useState(false);

  const handleAttachmentsUploaded = (
    attachments: { url: string; name: string; size: number }[]
  ) => {
    console.log("Adding Attachment", attachments);

    // Take only the first attachment and use its URL as imageUrl
    if (attachments.length > 0) {
      const firstAttachment = attachments[0];
      updateIssue({
        issueId: issue.id,
        imageUrl: firstAttachment?.url,
      });
    }
  };

  return (
    <Split
      sizes={[60, 40]}
      gutterSize={2}
      className="flex max-h-[70vh] w-full overflow-hidden"
      minSize={300}
    >
      <div className="overflow-y-auto pr-3">
        <div className="flex items-center gap-x-2">
          {isEpic(issue) ? <ColorPicker issue={issue} /> : null}
          <h1
            ref={ref}
            role="button"
            onClick={() => setIsEditing(true)}
            data-state={isEditing ? "editing" : "notEditing"}
            className="w-full transition-all [&[data-state=notEditing]]:hover:bg-gray-100"
          >
            <IssueTitle
              className="mr-1 py-1"
              key={issue.id + issue.name}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              issue={issue}
              ref={nameRef}
            />
          </h1>
        </div>
        <IssueDetailsInfoActions
          onAddChildIssue={() => setIsAddingChildIssue(true)}
          onAttachmentsUploaded={handleAttachmentsUploaded}
          variant={"lg"}
        />

        {/* Enhanced Image Display */}
        {issue?.imageUrl && (
          <ImageAttachment imageUrl={issue.imageUrl} alt="Issue attachment" />
        )}

        <Description issue={issue} key={String(issueKey) + issue.id} />
        {hasChildren(issue) || isAddingChildIssue ? (
          <ChildIssueList
            issues={issue.children}
            parentIsEpic={isEpic(issue)}
            parentId={issue.id}
            isAddingChildIssue={isAddingChildIssue}
            setIsAddingChildIssue={setIsAddingChildIssue}
          />
        ) : null}
        <Comments issue={issue} />
      </div>

      <div className="mt-4 bg-white pl-3">
        <div className="relative flex items-center gap-x-3">
          <IssueSelectStatus
            key={issue.id + issue.status}
            currentStatus={issue.status}
            issueId={issue.id}
            variant="lg"
          />
          <NotImplemented>
            <Button customColors className="hover:bg-gray-200">
              <div className="flex items-center">
                <LightningIcon className="mt-0.5" />
                <span>Actions</span>
              </div>
            </Button>
          </NotImplemented>
        </div>

        <IssueDetailsInfoAccordion issue={issue} />
        <IssueMetaInfo issue={issue} />
      </div>
    </Split>
  );
});

LargeIssueDetails.displayName = "LargeIssueDetails";

export { IssueDetailsInfo };
