import { ObjectId } from "@/lib/object-id";

export interface IAdmin {
  _id?: string; // MongoDB ObjectId as string
  userId: string; // String ID from better-auth
  permissions: string[];
  organizationId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateAdminDto {
  permissions: string[];
  organizationId: ObjectId;
}

export interface IUpdateAdminDto {
  permissions?: string[];
  organizationId?: ObjectId;
}
