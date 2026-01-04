/**
 * DocType Types
 *
 * TypeScript type definitions for Kairos-specific DocTypes
 */

import { FrappeDoc } from "./frappe";

/**
 * Student DocType
 */
export interface Student extends FrappeDoc {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: "Male" | "Female" | "Other";
  email?: string;
  phone?: string;
  address?: string;
  status?: "Active" | "Inactive" | "Graduated" | "Withdrawn";
}

/**
 * Guardian DocType
 */
export interface Guardian extends FrappeDoc {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  relationship?: string;
  address?: string;
}

/**
 * Institution DocType
 */
export interface Institution extends FrappeDoc {
  institution_name: string;
  institution_type?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

/**
 * Enrollment DocType
 */
export interface Enrollment extends FrappeDoc {
  student: string; // Link to Student
  institution: string; // Link to Institution
  enrollment_date: string;
  status?: "Active" | "Inactive" | "Completed" | "Cancelled";
  grade_level?: string;
  academic_year?: string;
}

/**
 * Guardian Invite DocType
 */
export interface GuardianInvite extends FrappeDoc {
  email: string;
  status: "Pending" | "Accepted" | "Expired" | "Cancelled";
  token?: string;
  expires_at?: string;
  invited_by?: string;
}

/**
 * Union type for all DocTypes
 */
export type KairosDocType =
  | Student
  | Guardian
  | Institution
  | Enrollment
  | GuardianInvite;

/**
 * DocType name string literals
 */
export type DocTypeName =
  | "Student"
  | "Guardian"
  | "Institution"
  | "Enrollment"
  | "Guardian Invite";
