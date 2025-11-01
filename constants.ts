

import { Role, InventoryItem, Transaction, Ritual, Entity, CalendarEvent } from './types';

export const pages = [
  { name: 'Dashboard', path: '/dashboard', icon: 'grid-outline', roles: [Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR, Role.MEMBER] },
  { name: 'Usuários', path: '/users', icon: 'people-outline', roles: [Role.ADMIN] },
  { name: 'Inventário', path: '/inventory', icon: 'cube-outline', roles: [Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR] },
  { name: 'Financeiro', path: '/finance', icon: 'cash-outline', roles: [Role.ADMIN, Role.DIRECTOR] },
  { name: 'Rituais', path: '/rituals', icon: 'calendar-outline', roles: [Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR, Role.MEMBER] },
  { name: 'Entidades', path: '/entities', icon: 'sparkles-outline', roles: [Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR, Role.MEMBER] },
  { name: 'Pontos Cantados', path: '/pontos', icon: 'musical-notes-outline', roles: [Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR, Role.MEMBER] },
  { name: 'Calendário', path: '/calendar', icon: 'today-outline', roles: [Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR, Role.MEMBER] },
  { name: 'Caderno de Notas', path: '/notebook', icon: 'book-outline', roles: [Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR, Role.MEMBER] },
  { name: 'Relatórios', path: '/reports', icon: 'document-text-outline', roles: [Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR] },
  { name: 'Configurações', path: '/settings', icon: 'settings-outline', roles: [Role.ADMIN] },
];

// FIX: Explicitly type mock data arrays to ensure their types match the interfaces, especially for the 'type' property in Transaction which is a literal union.
export const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Velas Brancas (7 dias)', sku: 'VEL-BR-7D', category: 'Velas', quantity: 100 },
  { id: '2', name: 'Charutos', sku: 'CHA-001', category: 'Tabacaria', quantity: 50 },
  { id: '3', name: 'Alfazema (líquida)', sku: 'ER-ALF-LIQ', category: 'Ervas', quantity: 20 },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Doação mensal', amount: 200, type: 'income', date: new Date().toISOString(), category: 'Doações' },
  { id: '2', description: 'Compra de velas', amount: 75.50, type: 'expense', date: new Date(Date.now() - 86400000).toISOString(), category: 'Material Ritualístico' },
  { id: '3', description: 'Conta de Luz', amount: 120.00, type: 'expense', date: new Date(Date.now() - 2 * 86400000).toISOString(), category: 'Contas Fixas' },
  { id: '4', description: 'Venda de itens na cantina', amount: 150.00, type: 'income', date: new Date(Date.now() - 3 * 86400000).toISOString(), category: 'Cantina' },
  { id: '5', description: 'Manutenção do congá', amount: 250.00, type: 'expense', date: new Date(Date.now() - 30 * 86400000).toISOString(), category: 'Manutenção' },
];

export const MOCK_RITUALS: Ritual[] = [
  { id: '1', name: 'Gira de Exu', date: new Date(Date.now() + 7 * 86400000).toISOString(), leader: 'Mãe de Santo', notes: 'Preparar pemba preta e velas vermelhas.' },
  { id: '2', name: 'Festa de Iemanjá', date: '2025-02-02T19:00:00.000Z', leader: 'Diretoria', notes: 'Comprar flores brancas e perfume de alfazema.' },
];

export const MOCK_ENTITIES: Entity[] = [
  { id: '1', name: 'Caboclo Pena Branca', type: 'Caboclo', mediumId: 'default-admin-001', candle: 'Verde', clothing: 'Cocar com penas brancas', notes: 'Chefe da casa' },
  { id: '2', name: 'Pai Joaquim de Angola', type: 'Preto Velho', mediumId: 'default-admin-001', candle: 'Branca e Preta', clothing: 'Roupa branca simples', notes: 'Adora café e cachimbo' },
];

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  // Feriados Nacionais e Pontos Facultativos 2025
  { id: 'cal-nat-1', date: '2025-01-01T12:00:00.000Z', title: 'Confraternização Universal', type: 'national' },
  { id: 'cal-nat-2', date: '2025-03-03T12:00:00.000Z', title: 'Carnaval (Ponto Facultativo)', type: 'national' },
  { id: 'cal-nat-3', date: '2025-03-04T12:00:00.000Z', title: 'Carnaval (Ponto Facultativo)', type: 'national' },
  { id: 'cal-nat-4', date: '2025-03-05T12:00:00.000Z', title: 'Quarta-Feira de Cinzas (Ponto Facultativo)', type: 'national' },
  { id: 'cal-nat-5', date: '2025-04-18T12:00:00.000Z', title: 'Paixão de Cristo', type: 'national' },
  { id: 'cal-nat-6', date: '2025-04-21T12:00:00.000Z', title: 'Tiradentes', type: 'national' },
  { id: 'cal-nat-7', date: '2025-05-01T12:00:00.000Z', title: 'Dia do Trabalho', type: 'national' },
  { id: 'cal-nat-8', date: '2025-06-19T12:00:00.000Z', title: 'Corpus Christi (Ponto Facultativo)', type: 'national' },
  { id: 'cal-nat-9', date: '2025-09-07T12:00:00.000Z', title: 'Independência do Brasil', type: 'national' },
  { id: 'cal-nat-10', date: '2025-10-12T12:00:00.000Z', title: 'Nossa Senhora Aparecida', type: 'national' },
  { id: 'cal-nat-11', date: '2025-10-28T12:00:00.000Z', title: 'Dia do Servidor Público (Ponto Facultativo)', type: 'national' },
  { id: 'cal-nat-12', date: '2025-11-02T12:00:00.000Z', title: 'Finados', type: 'national' },
  { id: 'cal-nat-13', date: '2025-11-15T12:00:00.000Z', title: 'Proclamação da República', type: 'national' },
  { id: 'cal-nat-14', date: '2025-11-20T12:00:00.000Z', title: 'Dia da Consciência Negra', type: 'national' },
  { id: 'cal-nat-15', date: '2025-12-24T12:00:00.000Z', title: 'Véspera do Natal (Ponto Facultativo)', type: 'national' },
  { id: 'cal-nat-16', date: '2025-12-25T12:00:00.000Z', title: 'Natal', type: 'national' },
  { id: 'cal-nat-17', date: '2025-12-31T12:00:00.000Z', title: 'Véspera do Ano Novo (Ponto Facultativo)', type: 'national' },
  
  // Feriados Estaduais (São Paulo)
  { id: 'cal-sp-1', date: '2025-01-25T12:00:00.000Z', title: 'Aniversário de São Paulo', type: 'state' },
  { id: 'cal-sp-2', date: '2025-07-09T12:00:00.000Z', title: 'Revolução Constitucionalista', type: 'state' },

  // Datas Comemorativas da Umbanda
  { id: 'cal-umb-1', date: '2025-01-20T12:00:00.000Z', title: 'Dia de Oxóssi', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-2', date: '2025-02-02T12:00:00.000Z', title: 'Dia de Iemanjá', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-3', date: '2025-04-23T12:00:00.000Z', title: 'Dia de Ogum', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-4', date: '2025-05-13T12:00:00.000Z', title: 'Dia dos Pretos Velhos', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-5', date: '2025-06-13T12:00:00.000Z', title: 'Dia de Exu', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-6', date: '2025-06-24T12:00:00.000Z', title: 'Dia de Xangô (São João)', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-7', date: '2025-07-26T12:00:00.000Z', title: 'Dia de Nanã Buruquê', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-8', date: '2025-08-16T12:00:00.000Z', title: 'Dia de Obaluaiê/Omulu', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-9', date: '2025-09-27T12:00:00.000Z', title: 'Dia de Cosme e Damião', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-10', date: '2025-09-30T12:00:00.000Z', title: 'Dia de Xangô (São Jerônimo)', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-11', date: '2025-11-15T12:00:00.000Z', title: 'Dia da Umbanda', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-12', date: '2025-12-04T12:00:00.000Z', title: 'Dia de Iansã', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-13', date: '2025-12-08T12:00:00.000Z', title: 'Dia de Oxum', type: 'umbanda', urgency: 'high' },
  { id: 'cal-umb-14', date: '2025-12-17T12:00:00.000Z', title: 'Dia de Omulu (São Lázaro)', type: 'umbanda', urgency: 'high' },
];