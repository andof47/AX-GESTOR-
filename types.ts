export enum Role {
  ADMIN = 'ADMIN',
  MAE_DE_SANTO = 'MAE_DE_SANTO',
  DIRECTOR = 'DIRECTOR',
  MEMBER = 'MEMBER',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  login: string;
  passwordHash: string;
  role: Role;
  category: string; // e.g., 'Médium', 'Ogã', 'Cambone'
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
}

export interface Ritual {
  id: string;
  name: string;
  date: string;
  leader: string;
  notes?: string;
}

export interface Entity {
  id: string;
  name: string;
  type: string; // 'Caboclo', 'Preto Velho', 'Exu', etc.
  mediumId: string; // User ID
  candle: string;
  clothing: string;
  notes: string;
}

export interface Ponto {
  id: string;
  title: string;
  category: string; // "Orixás", "Entidades", "Rituais", "Hinos", "Preces", "Linhas de Trabalho"
  subcategory: string; // "Ogum", "Caboclo", "Defumação", etc.
  lyrics: string;
}


export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'umbanda' | 'national' | 'state' | 'custom';
  urgency?: 'low' | 'medium' | 'high';
}

export interface DayNote {
  date: string; // YYYY-MM-DD, serves as the ID
  notes: string;
  urgency: 'high' | 'medium' | 'low' | 'none';
}

export interface GiraNote {
  id: string;
  date: string;
  entityId: string;
  mediumId: string;
  consulenteName: string;
  notes: string;
  camboneId: string;
}
