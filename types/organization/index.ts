import { ObjectId } from "@/lib/object-id";

export enum OrganizationType {
  SCHOOL = "school",
  UNIVERSITY = "university",
  TRAINING_CENTER = "training_center",
  CORPORATE = "corporate",
  NON_PROFIT = "non_profit",
}

export enum OrganizationStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  SUSPENDED = "suspended",
}

export interface IOrganization {
  _id?: string; // MongoDB ObjectId as string
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  description?: string;
  website?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    contactPerson: string;
  };
  subscription?: ObjectId;
  teachers: ObjectId[];
  students: ObjectId[];
  courses: ObjectId[];
  classes: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrganizationDto {
  name: string;
  type: OrganizationType;
  description?: string;
  website?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    contactPerson: string;
  };
}

export interface IUpdateOrganizationDto {
  name?: string;
  type?: OrganizationType;
  status?: OrganizationStatus;
  description?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contactInfo?: {
    email: string;
    phone: string;
    contactPerson: string;
  };
}

export interface IOrganizationResponse {
  id: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  description?: string;
  website?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    contactPerson: string;
  };
  subscription?: string;
  teachers: string[];
  students: string[];
  courses: string[];
  classes: string[];
  createdAt: Date;
  updatedAt: Date;
}
