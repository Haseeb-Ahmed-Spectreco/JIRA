"use client";
import { api } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export const useUser = () => {
  const { data: user, isLoading: userIsLoading } = useQuery(
    ["user"],
    api.user.getUser
  );

  return {
    user,
    userIsLoading,
  };
};
