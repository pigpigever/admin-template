export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "user";
  status: "active" | "disabled";
  createdAt: string;
}

export const mockUsers: UserRecord[] = [
  {
    id: 1,
    name: "Alice Chen",
    email: "alice@example.com",
    role: "admin",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Bob Li",
    email: "bob@example.com",
    role: "editor",
    status: "active",
    createdAt: "2024-02-20",
  },
  {
    id: 3,
    name: "Charlie Wang",
    email: "charlie@example.com",
    role: "user",
    status: "disabled",
    createdAt: "2024-03-10",
  },
  {
    id: 4,
    name: "Diana Zhang",
    email: "diana@example.com",
    role: "user",
    status: "active",
    createdAt: "2024-04-05",
  },
  {
    id: 5,
    name: "Edward Liu",
    email: "edward@example.com",
    role: "editor",
    status: "active",
    createdAt: "2024-05-12",
  },
];
