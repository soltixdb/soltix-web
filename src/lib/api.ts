// API service for Soltix TSDB
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

export interface Database {
  name: string;
  created_at: string;
  collections_count: number;
  size?: string;
  description?: string;
  collections?: Collection[];
}

export interface Collection {
  name: string;
  database: string;
  created_at: string;
  data_start_time?: string;
  first_data_time?: string;
  records_count: number;
  size: string;
  description?: string;
  device_ids?: string[];
}

export interface CollectionInfo {
  name: string;
  database: string;
  created_at: string;
  updated_at?: string;
  first_data_time?: string;
  records_count?: number;
  size?: string;
  description?: string;
  indexes?: string[];
  fields: { [key: string]: string };
  device_ids?: string[];
}

export interface FieldDefinition {
  name: string;
  type: "timestamp" | "string" | "number" | "boolean";
  required: boolean;
}

// Database operations
export const databaseApi = {
  async list(): Promise<Database[]> {
    const response = await fetch(`${API_BASE_URL}/v1/databases`, {
      headers: { 'X-API-Key': API_KEY },
    });
    if (!response.ok) throw new Error('Failed to fetch databases');
    const data = await response.json();
    // Handle both array and wrapped response formats
    return Array.isArray(data) ? data : (data.databases || data.data || []);
  },

  async create(name: string, description?: string): Promise<Database> {
    const payload: any = { name };
    if (description) payload.description = description;
    
    const response = await fetch(`${API_BASE_URL}/v1/databases`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    return response.json();
  },

  async delete(name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/databases/${name}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': API_KEY },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
  },
};

// Collection operations
export const collectionApi = {
  async list(database: string): Promise<Collection[]> {
    const response = await fetch(`${API_BASE_URL}/v1/databases/${database}/collections`, {
      headers: { 'X-API-Key': API_KEY },
    });
    if (!response.ok) throw new Error('Failed to fetch collections');
    const data = await response.json();
    // Ensure we return an array
    return Array.isArray(data) ? data : (data.collections || []);
  },

  async create(database: string, name: string, description?: string, fields?: FieldDefinition[]): Promise<Collection> {
    const payload: any = { name };
    if (description) payload.description = description;
    if (fields) payload.fields = fields;

    const response = await fetch(`${API_BASE_URL}/v1/databases/${database}/collections`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    return response.json();
  },

  async update(database: string, name: string, description?: string, fields?: FieldDefinition[]): Promise<Collection> {
    const payload: any = {};
    if (description !== undefined) payload.description = description;
    if (fields) payload.fields = fields;

    const response = await fetch(`${API_BASE_URL}/v1/databases/${database}/collections/${name}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    return response.json();
  },

  async delete(database: string, name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/databases/${database}/collections/${name}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': API_KEY },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
  },

  async getInfo(database: string, name: string): Promise<CollectionInfo> {
    const response = await fetch(`${API_BASE_URL}/v1/databases/${database}/collections/${name}`, {
      headers: { 'X-API-Key': API_KEY },
    });
    if (!response.ok) throw new Error('Failed to fetch collection info');
    return response.json();
  },
};
