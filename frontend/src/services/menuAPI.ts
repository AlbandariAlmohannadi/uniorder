import { api } from './api';

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMenuItemData {
  name: string;
  description?: string;
  price: number;
  category: string;
  is_available?: boolean;
  image_url?: string;
}

export interface UpdateMenuItemData extends Partial<CreateMenuItemData> {}

export interface MenuFilters {
  category?: string;
  is_available?: boolean;
  search?: string;
}

export const menuAPI = {
  // Get all menu items with optional filters
  async getMenuItems(filters?: MenuFilters) {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.is_available !== undefined) params.append('is_available', filters.is_available.toString());
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/menu?${params.toString()}`);
    return response.data;
  },

  // Get single menu item by ID
  async getMenuItem(id: number) {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },

  // Create new menu item
  async createMenuItem(data: CreateMenuItemData) {
    const response = await api.post('/menu', data);
    return response.data;
  },

  // Update existing menu item
  async updateMenuItem(id: number, data: UpdateMenuItemData) {
    const response = await api.put(`/menu/${id}`, data);
    return response.data;
  },

  // Delete menu item
  async deleteMenuItem(id: number) {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  },

  // Toggle menu item availability
  async toggleAvailability(id: number, is_available: boolean) {
    const response = await api.patch(`/menu/${id}/availability`, { is_available });
    return response.data;
  },

  // Get menu categories
  async getCategories() {
    const response = await api.get('/menu/categories');
    return response.data;
  },

  // Bulk update menu items
  async bulkUpdateItems(updates: Array<{ id: number; is_available: boolean }>) {
    const response = await api.patch('/menu/bulk-update', { updates });
    return response.data;
  },

  // Import menu items from CSV
  async importMenuItems(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/menu/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Export menu items to CSV
  async exportMenuItems() {
    const response = await api.get('/menu/export', {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `menu-items-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Menu exported successfully' };
  },

  // Get menu statistics
  async getMenuStats() {
    const response = await api.get('/menu/stats');
    return response.data;
  }
};