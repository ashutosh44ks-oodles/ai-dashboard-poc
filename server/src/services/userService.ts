import { query } from '../config/db.js';
import { User } from '../lib/types.js';
import { multipleQueryHandler } from '../lib/utils.js';

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const result = await query<User>("SELECT * FROM users");
    return multipleQueryHandler(result).rows;
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const result = await query<User>("SELECT * FROM users WHERE user_id = $1", [id]);
    return multipleQueryHandler(result).rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const result = await query<User>("SELECT * FROM users WHERE email = $1", [email]);
    return multipleQueryHandler(result).rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to fetch user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const createUser = async (name: string, email: string): Promise<User> => {
  try {
    const result = await query<User>(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    return multipleQueryHandler(result).rows[0];
  } catch (error) {
    throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateUser = async (id: number, name?: string, email?: string): Promise<User | null> => {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const result = await query<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );
    return multipleQueryHandler(result).rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteUser = async (id: number): Promise<boolean> => {
  try {
    const result = await query("DELETE FROM users WHERE user_id = $1", [id]);
    return multipleQueryHandler(result).rowCount !== null;
  } catch (error) {
    throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};