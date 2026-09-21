import { useEffect, useState } from "react";

import { getUsers, updateUser } from "../../services/adminUserService";

import type { User, UserRole } from "../../types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(userId: string, role: UserRole) {
    const updated = await updateUser(userId, { role });

    setUsers((current) =>
      current.map((user) => (user.id === updated.id ? updated : user)),
    );
  }

  async function toggleActive(user: User) {
    const updated = await updateUser(user.id, {
      is_active: !user.is_active,
    });

    setUsers((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
      <h1>Users</h1>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>

                <td>{user.email}</td>

                <td>
                  <select
                    value={user.role}
                    onChange={(event) =>
                      changeRole(user.id, event.target.value as UserRole)
                    }
                  >
                    <option value="CUSTOMER">Customer</option>

                    <option value="AGENT">Agent</option>

                    <option value="MANAGER">Manager</option>

                    <option value="ADMIN">Admin</option>
                  </select>
                </td>

                <td>{user.is_active ? "Active" : "Inactive"}</td>

                <td>
                  <button onClick={() => toggleActive(user)}>
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
