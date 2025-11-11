import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, InventoryItem, Transaction, Ritual, Entity, CalendarEvent, DayNote, Ponto, GiraNote } from './types';
import { MOCK_INVENTORY, MOCK_TRANSACTIONS, MOCK_RITUALS, MOCK_ENTITIES, MOCK_CALENDAR_EVENTS } from './constants';
import { MOCK_PONTOS } from './pontosData';


// --- Utility Functions ---
const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; 
    }
    return hash.toString();
};

const createDefaultAdmin = (): User[] => {
    return [{
        id: 'default-admin-001',
        name: 'Administrador',
        email: 'admin@voxmind.com',
        phone: 'N/A',
        login: 'admin',
        passwordHash: simpleHash('admin'),
        role: Role.ADMIN,
        category: 'Sistema'
    }];
};


// --- Data Context ---
interface DataContextType {
    users: User[];
    inventory: InventoryItem[];
    transactions: Transaction[];
    rituals: Ritual[];
    entities: Entity[];
    pontos: Ponto[];
    calendarEvents: CalendarEvent[];
    dayNotes: DayNote[];
    giraNotes: GiraNote[];
    addUser: (user: Omit<User, 'id' | 'passwordHash'> & { password: string }) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
    updateInventoryItem: (item: InventoryItem) => void;
    deleteInventoryItem: (itemId: string) => void;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    updateTransaction: (transaction: Transaction) => void;
    deleteTransaction: (transactionId: string) => void;
    addRitual: (ritual: Omit<Ritual, 'id'>) => void;
    updateRitual: (ritual: Ritual) => void;
    deleteRitual: (ritualId: string) => void;
    addEntity: (entity: Omit<Entity, 'id'>) => void;
    updateEntity: (entity: Entity) => void;
    deleteEntity: (entityId: string) => void;
    addPonto: (ponto: Omit<Ponto, 'id'>) => void;
    updatePonto: (ponto: Ponto) => void;
    deletePonto: (pontoId: string) => void;
    addGiraNote: (note: Omit<GiraNote, 'id'>) => void;
    updateGiraNote: (note: GiraNote) => void;
    deleteGiraNote: (noteId: string) => void;
    addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
    updateCalendarEvent: (event: CalendarEvent) => void;
    deleteCalendarEvent: (eventId: string) => void;
    upsertDayNote: (note: DayNote) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            const valueToStore = JSON.stringify(storedValue);
            window.localStorage.setItem(key, valueToStore);
        } catch (error) {
            console.error(error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};

export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [users, setUsers] = useLocalStorage<User[]>('voxmind_users', createDefaultAdmin());
    const [inventory, setInventory] = useLocalStorage<InventoryItem[]>('voxmind_inventory', MOCK_INVENTORY);
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('voxmind_transactions', MOCK_TRANSACTIONS);
    const [rituals, setRituals] = useLocalStorage<Ritual[]>('voxmind_rituals', MOCK_RITUALS);
    const [entities, setEntities] = useLocalStorage<Entity[]>('voxmind_entities', MOCK_ENTITIES);
    const [pontos, setPontos] = useLocalStorage<Ponto[]>('voxmind_pontos', MOCK_PONTOS);
    const [calendarEvents, setCalendarEvents] = useLocalStorage<CalendarEvent[]>('voxmind_calendar_events', MOCK_CALENDAR_EVENTS);
    const [dayNotes, setDayNotes] = useLocalStorage<DayNote[]>('voxmind_day_notes', []);
    const [giraNotes, setGiraNotes] = useLocalStorage<GiraNote[]>('voxmind_giraNotes', []);

    const addUser = (userData: Omit<User, 'id' | 'passwordHash'> & { password: string }) => {
        const { password, ...rest } = userData;
        const newUser: User = {
            ...rest,
            id: crypto.randomUUID(),
            passwordHash: simpleHash(password),
        };
        setUsers(prev => [...prev, newUser]);
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const deleteUser = (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    };

    const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
        const newItem: InventoryItem = {
            ...itemData,
            id: crypto.randomUUID(),
        };
        setInventory(prev => [...prev, newItem]);
    };

    const updateInventoryItem = (updatedItem: InventoryItem) => {
        setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    const deleteInventoryItem = (itemId: string) => {
        setInventory(prev => prev.filter(item => item.id !== itemId));
    };

    const addTransaction = (transactionData: Omit<Transaction, 'id'>) => {
        const newTransaction: Transaction = {
            ...transactionData,
            id: crypto.randomUUID(),
        };
        setTransactions(prev => [...prev, newTransaction]);
    };

    const updateTransaction = (updatedTransaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    };

    const deleteTransaction = (transactionId: string) => {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
    };
    
    const addRitual = (ritualData: Omit<Ritual, 'id'>) => {
        const newRitual: Ritual = {
            ...ritualData,
            id: crypto.randomUUID(),
        };
        setRituals(prev => [...prev, newRitual]);
    };

    const updateRitual = (updatedRitual: Ritual) => {
        setRituals(prev => prev.map(r => r.id === updatedRitual.id ? updatedRitual : r));
    };

    const deleteRitual = (ritualId: string) => {
        setRituals(prev => prev.filter(r => r.id !== ritualId));
    };

    const addEntity = (entityData: Omit<Entity, 'id'>) => {
        const newEntity: Entity = { ...entityData, id: crypto.randomUUID() };
        setEntities(prev => [...prev, newEntity]);
    };
    const updateEntity = (updatedEntity: Entity) => {
        setEntities(prev => prev.map(e => e.id === updatedEntity.id ? updatedEntity : e));
    };
    const deleteEntity = (entityId: string) => {
        setEntities(prev => prev.filter(e => e.id !== entityId));
    };
    
    const addPonto = (pontoData: Omit<Ponto, 'id'>) => {
        const newPonto: Ponto = { ...pontoData, id: crypto.randomUUID() };
        setPontos(prev => [...prev, newPonto]);
    };
    const updatePonto = (updatedPonto: Ponto) => {
        setPontos(prev => prev.map(p => p.id === updatedPonto.id ? updatedPonto : p));
    };
    const deletePonto = (pontoId: string) => {
        setPontos(prev => prev.filter(p => p.id !== pontoId));
    };

    const addGiraNote = (noteData: Omit<GiraNote, 'id'>) => {
        const newNote: GiraNote = { ...noteData, id: crypto.randomUUID() };
        setGiraNotes(prev => [...prev, newNote]);
    };
    const updateGiraNote = (updatedNote: GiraNote) => {
        setGiraNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    };
    const deleteGiraNote = (noteId: string) => {
        setGiraNotes(prev => prev.filter(n => n.id !== noteId));
    };

    const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
        const newEvent: CalendarEvent = { ...eventData, id: crypto.randomUUID() };
        setCalendarEvents(prev => [...prev, newEvent]);
    };
    const updateCalendarEvent = (updatedEvent: CalendarEvent) => {
        setCalendarEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    };
    const deleteCalendarEvent = (eventId: string) => {
        setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
    };

    const upsertDayNote = (noteData: DayNote) => {
        setDayNotes(prev => {
            const existingIndex = prev.findIndex(n => n.date === noteData.date);
            
            if (existingIndex > -1) {
                // If the note is empty and urgency is none, remove it
                if (!noteData.notes && noteData.urgency === 'none') {
                    const newArr = [...prev];
                    newArr.splice(existingIndex, 1);
                    return newArr;
                }
                // Otherwise, update it
                const newArr = [...prev];
                newArr[existingIndex] = noteData;
                return newArr;
            } else {
                 // Don't add if it's empty
                if (!noteData.notes && noteData.urgency === 'none') {
                    return prev;
                }
                // Add new note
                return [...prev, noteData];
            }
        });
    };


    const value = { 
        users, inventory, transactions, rituals, entities, pontos, calendarEvents, dayNotes, giraNotes,
        addUser, updateUser, deleteUser, 
        addInventoryItem, updateInventoryItem, deleteInventoryItem,
        addTransaction, updateTransaction, deleteTransaction,
        addRitual, updateRitual, deleteRitual,
        addEntity, updateEntity, deleteEntity,
        addPonto, updatePonto, deletePonto,
        addGiraNote, updateGiraNote, deleteGiraNote,
        addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
        upsertDayNote
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// --- Auth Context ---
interface AuthContextType {
    isInitialized: boolean;
    user: User | null;
    needsSetup: boolean;
    login: (username: string, password_raw: string) => boolean;
    logout: () => void;
    setupAdmin: (password: string) => void;
    changePassword: (oldPasswordRaw: string, newPasswordRaw: string) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const { users, addUser, updateUser } = useData();
    const [user, setUser] = useState<User | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [needsSetup, setNeedsSetup] = useState(false);

    useEffect(() => {
        const adminExists = users.some(u => u.role === Role.ADMIN);
        if (!adminExists) {
            setNeedsSetup(true);
        } else {
            const loggedInUser = sessionStorage.getItem('voxmind_user');
            if(loggedInUser) {
                setUser(JSON.parse(loggedInUser));
            }
        }
        setIsInitialized(true);
    }, [users]);
    
    const login = (username: string, password_raw: string) => {
        const passwordHash = simpleHash(password_raw);
        const foundUser = users.find(u => u.login.toLowerCase() === username.toLowerCase() && u.passwordHash === passwordHash);
        if (foundUser) {
            setUser(foundUser);
            sessionStorage.setItem('voxmind_user', JSON.stringify(foundUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('voxmind_user');
    };
    
    const setupAdmin = (password: string) => {
        const adminData = {
            name: 'Administrador',
            email: 'admin@voxmind.com',
            phone: 'N/A',
            login: 'admin',
            password: password,
            role: Role.ADMIN,
            category: 'Sistema'
        };
        addUser(adminData);
        setNeedsSetup(false);
    };

    const changePassword = (oldPasswordRaw: string, newPasswordRaw: string): { success: boolean; message: string } => {
        if (!user) {
            return { success: false, message: 'Nenhum usuário logado.' };
        }

        const userFromStorage = users.find(u => u.id === user.id);
        if (!userFromStorage) {
             return { success: false, message: 'Usuário não encontrado.' };
        }

        const oldPasswordHash = simpleHash(oldPasswordRaw);
        if (userFromStorage.passwordHash !== oldPasswordHash) {
            return { success: false, message: 'Senha atual incorreta.' };
        }

        const newPasswordHash = simpleHash(newPasswordRaw);
        const updatedUser = { ...userFromStorage, passwordHash: newPasswordHash };
        
        updateUser(updatedUser);
        
        // Update user in current session
        setUser(updatedUser);
        sessionStorage.setItem('voxmind_user', JSON.stringify(updatedUser));

        return { success: true, message: 'Senha alterada com sucesso!' };
    };


    const value = { isInitialized, user, needsSetup, login, logout, setupAdmin, changePassword };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// --- Theme Context ---
type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('voxmind_theme');
    return (savedTheme as Theme) || 'dark'; // Default to dark theme
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('voxmind_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = { theme, setTheme };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};