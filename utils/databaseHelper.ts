import {
  clearUsers,
  countUsers,
  findUserByEmail,
  findUserById,
  UserRecord,
} from "../app/database";

export class DatabaseHelper {
  clearAllUsers(): void {
    clearUsers();
  }

  getUserById(
    id: number
  ): UserRecord | undefined {
    return findUserById(id);
  }

  getUserByEmail(
    email: string
  ): UserRecord | undefined {
    return findUserByEmail(email);
  }

  getUserCount(): number {
    return countUsers();
  }
}