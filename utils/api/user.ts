import {
  type GetUserResponse,
  type PostUserResponse,
} from "@/app/api/user/[user_id]/route";
import { type GetUsersByCompanyResponse } from "@/app/api/user/by-company/route";
import { type DefaultUser } from "@prisma/client";
import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

type CreateUserBody = Omit<DefaultUser, "id">;

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
  getUsersByCompany: async (company_id: string, site_code: string) => {
    const { data } = await axios.get<GetUsersByCompanyResponse>(
      `${baseUrl}/api/user/by-company`,
      {
        params: {
          company_id,
          site_code,
        },
      }
    );
    return data?.users || [];
  },
  createUser: async (body: CreateUserBody) => {
    const { data } = await axios.post<PostUserResponse>(
      `${baseUrl}/api/user`,
      body
    );
    return data;
  },
};
