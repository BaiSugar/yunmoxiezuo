import { User } from '../entities/user.entity';

export interface PaginatedUsers {
  items: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

