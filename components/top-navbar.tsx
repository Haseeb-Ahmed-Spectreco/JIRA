"use client";
import { SignInButton, useUser, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { useFullURL } from "@/hooks/use-full-url";

const TopNavbar: React.FC = () => {
  const { user } = useUser();
  const [url] = useFullURL();

  return (
    <div className="flex h-[50px] w-full items-center justify-between border-b px-4">
      <div className="flex items-center gap-x-2">
        <div className="relative mr-2 h-[50px] w-[150px]">
          <Image
            priority={true}
            src="https://cdn-ilcaioh.nitrocdn.com/tVywMbvOOHDiGAOcynXdoFQXNDRISAkU/assets/images/optimized/rev-9ba3d72/spectreco.com/wp-content/uploads/2024/06/logo.png"
            alt="Jira logo"
            fill
            sizes="(max-width: 300px) 100px, 150px"
            className="object-contain" // Force auto dimensions
          />
        </div>
        <span className="text-sm font-medium text-gray-600">Jira Clone</span>
      </div>
      {user ? (
        <div className="flex items-center gap-x-2">
          <span className="text-sm font-medium text-gray-600">
            {user?.fullName ?? user?.emailAddresses[0]?.emailAddress ?? "Guest"}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      ) : (
        <div className="flex items-center gap-x-3">
          <div className="rounded-sm bg-inprogress px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600">
            <SignInButton mode="modal" redirectUrl={url} />
          </div>
        </div>
      )}
    </div>
  );
};

export { TopNavbar };
