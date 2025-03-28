import {
  type GetUserResponse,
  type PostUserResponse,
} from "@/app/api/user/[user_id]/route";
import { type DefaultUser } from "@prisma/client";
import axios from "axios";

const baseUrl = "http://localhost:3000";

export const UserRoutes = {
  getUser: async () => {
    console.log("Base URL: ", baseUrl);
    const { data } = await axios.get<GetUserResponse>(
      `${baseUrl}/api/user/user_2PvBRngdvenUlFvQNAWbXIvYVy5`
    );
    console.log("User data from Database", data);
    return data?.user || null;
  },
  getUserByEmail: async (email: string) => {
    const { data } = await axios.get<GetUserResponse>(
      `${baseUrl}/api/user/${email}`
    );
    return data?.user || null;
  },
  createUser: async (body: DefaultUser) => {
    const { data } = await axios.post<PostUserResponse>(
      `${baseUrl}/api/user`,
      body
    );
    return data;
  },
};
