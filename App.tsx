import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts';
import { DataProvider, useData } from './contexts';
import { Role, User, InventoryItem, Transaction, Ritual, Entity, CalendarEvent, DayNote, Ponto, GiraNote } from './types';
import { pages } from './constants';
import { ThemeProvider, useTheme } from './contexts';

// FIX: Corrected JSX namespace augmentation for custom elements.
// The previous 'declare global' implementation was overwriting React's native IntrinsicElements.
// This version uses `declare module 'react'` to correctly merge with existing types.
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'ion-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { name: string; }, HTMLElement>;
        }
    }
}


// --- Charts Components ---
const ExpenseCategoryChart = () => {
    const { transactions } = useData();
    const { theme } = useTheme();
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null); // Using 'any' for Chart.js instance

    useEffect(() => {
        if (!chartRef.current) return;
        
        const expenseData = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const category = t.category || 'Outros';
                acc[category] = (acc[category] || 0) + t.amount;
                return acc;
            }, {} as { [key: string]: number });

        const labels = Object.keys(expenseData);
        const data = Object.values(expenseData);
        
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const labelColor = theme === 'dark' ? '#d1d5db' : '#4b5563';
        const titleColor = theme === 'dark' ? '#f9fafb' : '#111827';
        const borderColor = theme === 'dark' ? '#1f2937' : '#ffffff';


        chartInstance.current = new (window as any).Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Despesas por Categoria',
                    data: data,
                    backgroundColor: ['#6d28d9', '#a78bfa', '#facc15', '#ef4444', '#22c55e', '#3b82f6'],
                    borderColor: borderColor,
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: labelColor,
                            font: {
                                family: 'Inter, sans-serif'
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribuição de Despesas',
                        color: titleColor,
                        font: {
                            size: 18,
                            family: 'Inter, sans-serif'
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };

    }, [transactions, theme]);
    
    return <div className="h-80"><canvas ref={chartRef}></canvas></div>;
};

const MonthlyIOChart = () => {
    const { transactions } = useData();
    const { theme } = useTheme();
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const monthlyData = transactions.reduce((acc, t) => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!acc[month]) {
                acc[month] = { income: 0, expense: 0 };
            }
            acc[month][t.type] += t.amount;
            return acc;
        }, {} as { [key: string]: { income: number; expense: number } });

        const labels = Object.keys(monthlyData).reverse();
        const incomeData = labels.map(label => monthlyData[label].income);
        const expenseData = labels.map(label => monthlyData[label].expense);
        
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const labelColor = theme === 'dark' ? '#d1d5db' : '#4b5563';
        const titleColor = theme === 'dark' ? '#f9fafb' : '#111827';
        const gridColor = theme === 'dark' ? 'rgba(209, 213, 219, 0.2)' : 'rgba(107, 114, 128, 0.2)';

        chartInstance.current = new (window as any).Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Receitas',
                        data: incomeData,
                        backgroundColor: '#22c55e',
                    },
                    {
                        label: 'Despesas',
                        data: expenseData,
                        backgroundColor: '#ef4444',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: labelColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: labelColor },
                        grid: { display: false }
                    }
                },
                plugins: {
                     legend: {
                        position: 'top',
                        labels: { color: labelColor }
                    },
                    title: {
                        display: true,
                        text: 'Receitas vs. Despesas Mensais',
                        color: titleColor,
                        font: { size: 18, family: 'Inter, sans-serif' }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [transactions, theme]);
    
    return <div className="h-80"><canvas ref={chartRef}></canvas></div>;
};

const LinkCard = ({ icon, title, description, path }: { icon: string; title: string; description: string; path: string }) => (
    <Link to={path} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
        <div className="bg-primary p-3 rounded-full">
            <ion-icon name={icon} className="text-3xl text-white"></ion-icon>
        </div>
        <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">{title}</h3>
            <p className="text-gray-600 dark:text-slate-400">{description}</p>
        </div>
    </Link>
);

const MemberDashboardView = () => {
    const { rituals } = useData();

    const upcomingRituals = rituals
        .filter(r => new Date(r.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50 mb-4">Próximos Rituais</h2>
                <ul className="space-y-3">
                    {upcomingRituals.length > 0 ? (
                        upcomingRituals.map(ritual => (
                            <li key={ritual.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-slate-700">
                                <span className="font-semibold">{ritual.name}</span>
                                <span className="text-sm text-gray-600 dark:text-slate-400">{new Date(ritual.date).toLocaleDateString('pt-BR')}</span>
                            </li>
                        ))
                    ) : (
                        <p className="text-gray-600 dark:text-slate-400">Nenhum ritual agendado.</p>
                    )}
                </ul>
            </div>
            <div className="space-y-6">
                <LinkCard icon="musical-notes-outline" title="Pontos Cantados" description="Acesse o acervo de pontos" path="/pontos" />
                <LinkCard icon="today-outline" title="Calendário" description="Veja os eventos e datas importantes" path="/calendar" />
            </div>
        </div>
    );
};


const Dashboard = () => {
    const { users, inventory, rituals, transactions } = useData();
    const { user } = useAuth();

    const upcomingRituals = rituals
        .filter(r => new Date(r.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    const totalBalance = transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
    
    const hasFinancialAccess = user && [Role.ADMIN, Role.DIRECTOR, Role.MAE_DE_SANTO].includes(user.role);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50 mb-6">Painel Principal</h1>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${hasFinancialAccess ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-6`}>
                <StatCard icon="people-outline" title="Total de Usuários" value={users.length.toString()} />
                <StatCard icon="cube-outline" title="Itens no Inventário" value={inventory.length.toString()} />
                <StatCard icon="calendar-outline" title="Próximos Rituais" value={upcomingRituals.length.toString()} />
                {hasFinancialAccess && <StatCard icon="cash-outline" title="Balanço Financeiro" value={totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />}
            </div>
            {hasFinancialAccess ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                        <MonthlyIOChart />
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                        <ExpenseCategoryChart />
                    </div>
                </div>
            ) : (
                <MemberDashboardView />
            )}
        </div>
    );
};

const StatCard = ({ icon, title, value }: { icon: string; title: string; value: string }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
        <div className="bg-primary p-3 rounded-full">
            <ion-icon name={icon} className="text-3xl text-white"></ion-icon>
        </div>
        <div>
            <h3 className="text-sm text-gray-600 dark:text-slate-400">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{value}</p>
        </div>
    </div>
);


// --- User Management Page ---

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userData: Omit<User, 'id' | 'passwordHash'> & { password?: string, id?: string }) => void;
    user: User | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, user }) => {
    const isEditing = !!user;
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        login: '',
        password: '',
        confirmPassword: '',
        role: Role.MEMBER,
        category: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (isEditing) {
                setFormData({
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    login: user.login,
                    password: '',
                    confirmPassword: '',
                    role: user.role,
                    category: user.category,
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    login: '',
                    password: '',
                    confirmPassword: '',
                    role: Role.MEMBER,
                    category: '',
                });
            }
        }
    }, [isOpen, user, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isEditing) {
            if (formData.password.length < 6) {
                setError('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('As senhas não coincidem.');
                return;
            }
        }

        const { confirmPassword, ...dataToSave } = formData;
        
        onSave({ ...dataToSave, id: user?.id });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto text-gray-900 dark:text-slate-50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                        <ion-icon name="close-outline" className="text-3xl"></ion-icon>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Nome Completo</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Login</label>
                            <input type="text" name="login" value={formData.login} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Telefone</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Função</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                                {Object.values(Role).map(roleValue => (
                                    <option key={roleValue} value={roleValue}>{roleValue}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Categoria (Ex: Médium, Ogã)</label>
                            <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                         {!isEditing && (
                            <>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Senha</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Confirmar Senha</label>
                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Users = () => {
    const { users, addUser, updateUser, deleteUser } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleOpenModal = (user: User | null) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setUserToEdit(null);
    };

    const handleSaveUser = (userData: Omit<User, 'id' | 'passwordHash'> & { password?: string; id?: string }) => {
        if (userToEdit && userData.id) { // Editing existing user
            const existingUser = users.find(u => u.id === userData.id);
            if (!existingUser) return;
            
            const updatedUser: User = {
                ...existingUser,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                login: userData.login,
                role: userData.role,
                category: userData.category,
            };
            updateUser(updatedUser);
        } else if (userData.password) { // Adding new user
            const { password, ...newUserDara } = userData;
            addUser({ ...newUserDara, password });
        }
        handleCloseModal();
    };

    const openDeleteConfirm = (user: User) => {
        setUserToDelete(user);
    };

    const closeDeleteConfirm = () => {
        setUserToDelete(null);
    };

    const handleDeleteUser = () => {
        if (userToDelete) {
            if(userToDelete.login === 'admin') {
                alert("Não é possível excluir o administrador padrão.");
                closeDeleteConfirm();
                return;
            }
            deleteUser(userToDelete.id);
            closeDeleteConfirm();
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">Gerenciamento de Usuários</h1>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="flex items-center bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition duration-200"
                >
                    <ion-icon name="add-outline" className="mr-2 text-xl"></ion-icon>
                    Adicionar Usuário
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="p-4 font-semibold">Nome</th>
                                <th className="p-4 font-semibold">Login</th>
                                <th className="p-4 font-semibold">Função</th>
                                <th className="p-4 font-semibold">Categoria</th>
                                <th className="p-4 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4">{user.name}</td>
                                    <td className="p-4">{user.login}</td>
                                    <td className="p-4">{user.role}</td>
                                    <td className="p-4">{user.category}</td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenModal(user)} className="text-accent hover:text-primary p-1" aria-label={`Editar ${user.name}`}>
                                                <ion-icon name="create-outline" className="text-xl"></ion-icon>
                                            </button>
                                            <button onClick={() => openDeleteConfirm(user)} className="text-error hover:text-red-700 p-1" aria-label={`Excluir ${user.name}`}>
                                                <ion-icon name="trash-outline" className="text-xl"></ion-icon>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <UserFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveUser}
                user={userToEdit}
            />

            {userToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-gray-900 dark:text-slate-50" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title">
                        <h2 id="delete-dialog-title" className="text-2xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">
                            Você tem certeza que deseja excluir o usuário <span className="font-bold text-gray-900 dark:text-slate-50">{userToDelete.name}</span>? Esta ação não pode ser desfeita.
                        </p>
                         <div className="flex justify-end space-x-4">
                            <button onClick={closeDeleteConfirm} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition">Cancelar</button>
                            <button onClick={handleDeleteUser} className="py-2 px-4 bg-error text-white font-semibold rounded-lg hover:bg-red-700 transition">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Inventory Management Page ---

interface InventoryItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemData: Omit<InventoryItem, 'id'> & { id?: string }) => void;
    item: InventoryItem | null;
}

const InventoryItemFormModal: React.FC<InventoryItemFormModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const isEditing = !!item;
    
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        quantity: 0,
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    name: item.name,
                    sku: item.sku,
                    category: item.category,
                    quantity: item.quantity,
                });
            } else {
                setFormData({
                    name: '',
                    sku: '',
                    category: '',
                    quantity: 0,
                });
            }
        }
    }, [isOpen, item, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: item?.id });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-lg text-gray-900 dark:text-slate-50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{isEditing ? 'Editar Item' : 'Adicionar Novo Item'}</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                        <ion-icon name="close-outline" className="text-3xl"></ion-icon>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Nome do Item</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">SKU (Código)</label>
                            <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Quantidade</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0" className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Categoria</label>
                        <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Inventory = () => {
    const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

    const handleOpenModal = (item: InventoryItem | null) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setItemToEdit(null);
    };

    const handleSaveItem = (itemData: Omit<InventoryItem, 'id'> & { id?: string }) => {
        if (itemToEdit && itemData.id) {
            updateInventoryItem({ ...itemData, id: itemData.id });
        } else {
            const { id, ...newItemData } = itemData;
            addInventoryItem(newItemData);
        }
        handleCloseModal();
    };
    
    const openDeleteConfirm = (item: InventoryItem) => {
        setItemToDelete(item);
    };

    const closeDeleteConfirm = () => {
        setItemToDelete(null);
    };

    const handleDeleteItem = () => {
        if (itemToDelete) {
            deleteInventoryItem(itemToDelete.id);
            closeDeleteConfirm();
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">Gerenciamento de Inventário</h1>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="flex items-center bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition duration-200"
                >
                    <ion-icon name="add-outline" className="mr-2 text-xl"></ion-icon>
                    Adicionar Item
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="p-4 font-semibold">Nome</th>
                                <th className="p-4 font-semibold">SKU</th>
                                <th className="p-4 font-semibold">Categoria</th>
                                <th className="p-4 font-semibold">Quantidade</th>
                                <th className="p-4 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map(item => (
                                <tr key={item.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4">{item.name}</td>
                                    <td className="p-4">{item.sku}</td>
                                    <td className="p-4">{item.category}</td>
                                    <td className="p-4">{item.quantity}</td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenModal(item)} className="text-accent hover:text-primary p-1" aria-label={`Editar ${item.name}`}>
                                                <ion-icon name="create-outline" className="text-xl"></ion-icon>
                                            </button>
                                            <button onClick={() => openDeleteConfirm(item)} className="text-error hover:text-red-700 p-1" aria-label={`Excluir ${item.name}`}>
                                                <ion-icon name="trash-outline" className="text-xl"></ion-icon>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <InventoryItemFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveItem}
                item={itemToEdit}
            />

            {itemToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-gray-900 dark:text-slate-50" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title">
                        <h2 id="delete-dialog-title" className="text-2xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">
                            Você tem certeza que deseja excluir o item <span className="font-bold text-gray-900 dark:text-slate-50">{itemToDelete.name}</span>? Esta ação não pode ser desfeita.
                        </p>
                         <div className="flex justify-end space-x-4">
                            <button onClick={closeDeleteConfirm} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition">Cancelar</button>
                            <button onClick={handleDeleteItem} className="py-2 px-4 bg-error text-white font-semibold rounded-lg hover:bg-red-700 transition">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Finance Management Page ---
interface TransactionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemData: Omit<Transaction, 'id'> & { id?: string }) => void;
    item: Transaction | null;
}

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const isEditing = !!item;

    const [formData, setFormData] = useState({
        description: '',
        amount: 0,
        type: 'expense' as 'income' | 'expense',
        date: new Date().toISOString().split('T')[0],
        category: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    description: item.description,
                    amount: item.amount,
                    type: item.type,
                    date: new Date(item.date).toISOString().split('T')[0],
                    category: item.category,
                });
            } else {
                 setFormData({
                    description: '',
                    amount: 0,
                    type: 'expense' as 'income' | 'expense',
                    date: new Date().toISOString().split('T')[0],
                    category: '',
                });
            }
        }
    }, [isOpen, item, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: item?.id });
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-lg text-gray-900 dark:text-slate-50">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{isEditing ? 'Editar Transação' : 'Adicionar Nova Transação'}</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><ion-icon name="close-outline" className="text-3xl"></ion-icon></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Descrição</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Valor (R$)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} min="0" step="0.01" className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Tipo</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                                <option value="income">Receita</option>
                                <option value="expense">Despesa</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Data</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Categoria</label>
                            <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}


const Finance = () => {
    const { transactions, addTransaction, updateTransaction, deleteTransaction } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Transaction | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const handleOpenModal = (item: Transaction | null) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setItemToEdit(null);
    };

    const handleSaveItem = (itemData: Omit<Transaction, 'id'> & { id?: string }) => {
        const dataWithDate = { ...itemData, date: new Date(itemData.date).toISOString() };
        if (itemToEdit && itemData.id) {
            updateTransaction({ ...dataWithDate, id: itemData.id });
        } else {
            const { id, ...newItemData } = dataWithDate;
            addTransaction(newItemData);
        }
        handleCloseModal();
    };
    
    const openDeleteConfirm = (item: Transaction) => setItemToDelete(item);
    const closeDeleteConfirm = () => setItemToDelete(null);

    const handleDeleteItem = () => {
        if (itemToDelete) {
            deleteTransaction(itemToDelete.id);
            closeDeleteConfirm();
        }
    };
    
    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">Gerenciamento Financeiro</h1>
                <button onClick={() => handleOpenModal(null)} className="flex items-center bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition">
                    <ion-icon name="add-outline" className="mr-2 text-xl"></ion-icon>
                    Adicionar Transação
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-sm text-green-500 dark:text-green-400">Total de Receitas</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-sm text-red-500 dark:text-red-400">Total de Despesas</h3>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-sm text-gray-600 dark:text-slate-400">Saldo Atual</h3>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-gray-900 dark:text-slate-50' : 'text-red-600 dark:text-red-400'}`}>{balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="p-4 font-semibold">Descrição</th>
                                <th className="p-4 font-semibold">Categoria</th>
                                <th className="p-4 font-semibold">Valor</th>
                                <th className="p-4 font-semibold">Tipo</th>
                                <th className="p-4 font-semibold">Data</th>
                                <th className="p-4 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                                <tr key={item.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4">{item.description}</td>
                                    <td className="p-4">{item.category}</td>
                                    <td className={`p-4 font-medium ${item.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {item.type === 'income' ? '+' : '-'} {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'income' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                                            {item.type === 'income' ? 'Receita' : 'Despesa'}
                                        </span>
                                    </td>
                                    <td className="p-4">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenModal(item)} className="text-accent hover:text-primary p-1" aria-label={`Editar ${item.description}`}><ion-icon name="create-outline" className="text-xl"></ion-icon></button>
                                            <button onClick={() => openDeleteConfirm(item)} className="text-error hover:text-red-700 p-1" aria-label={`Excluir ${item.description}`}><ion-icon name="trash-outline" className="text-xl"></ion-icon></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <TransactionFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} item={itemToEdit}/>

            {itemToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-gray-900 dark:text-slate-50" role="alertdialog">
                        <h2 className="text-2xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">Deseja excluir a transação <span className="font-bold text-gray-900 dark:text-slate-50">{itemToDelete.description}</span>?</p>
                         <div className="flex justify-end space-x-4">
                            <button onClick={closeDeleteConfirm} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Cancelar</button>
                            <button onClick={handleDeleteItem} className="py-2 px-4 bg-error text-white font-semibold rounded-lg hover:bg-red-700">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
};


// --- Rituals Management Page ---
interface RitualFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemData: Omit<Ritual, 'id'> & { id?: string }) => void;
    item: Ritual | null;
}

const RitualFormModal: React.FC<RitualFormModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const isEditing = !!item;
    const { user } = useAuth();
    const hasNotesAccess = user && [Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR].includes(user.role);

    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        leader: '',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    name: item.name,
                    date: new Date(item.date).toISOString().split('T')[0],
                    leader: item.leader,
                    notes: item.notes || '',
                });
            } else {
                 setFormData({
                    name: '',
                    date: new Date().toISOString().split('T')[0],
                    leader: '',
                    notes: '',
                });
            }
        }
    }, [isOpen, item, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: item?.id });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-lg text-gray-900 dark:text-slate-50">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{isEditing ? 'Editar Ritual' : 'Agendar Novo Ritual'}</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><ion-icon name="close-outline" className="text-3xl"></ion-icon></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Nome do Ritual</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Data</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Líder / Responsável</label>
                            <input type="text" name="leader" value={formData.leader} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                    </div>
                    {hasNotesAccess && (
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Anotações (Visível para Admin, Mãe de Santo, Diretor)</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                        </div>
                    )}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const Rituals = () => {
    const { rituals, addRitual, updateRitual, deleteRitual } = useData();
    const { user } = useAuth();
    const hasNotesAccess = user && [Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR].includes(user.role);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Ritual | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Ritual | null>(null);

    const handleOpenModal = (item: Ritual | null) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setItemToEdit(null);
    };

    const handleSaveItem = (itemData: Omit<Ritual, 'id'> & { id?: string }) => {
        const dataWithDate = { ...itemData, date: new Date(itemData.date).toISOString() };
        if (itemToEdit && itemData.id) {
            updateRitual({ ...dataWithDate, id: itemData.id });
        } else {
            const { id, ...newItemData } = dataWithDate;
            addRitual(newItemData);
        }
        handleCloseModal();
    };

    const openDeleteConfirm = (item: Ritual) => setItemToDelete(item);
    const closeDeleteConfirm = () => setItemToDelete(null);

    const handleDeleteItem = () => {
        if (itemToDelete) {
            deleteRitual(itemToDelete.id);
            closeDeleteConfirm();
        }
    };
    
    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">Gerenciamento de Rituais</h1>
                <button onClick={() => handleOpenModal(null)} className="flex items-center bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition">
                    <ion-icon name="add-outline" className="mr-2 text-xl"></ion-icon>
                    Agendar Ritual
                </button>
            </div>
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="p-4 font-semibold">Nome</th>
                                <th className="p-4 font-semibold">Data</th>
                                <th className="p-4 font-semibold">Líder</th>
                                {hasNotesAccess && <th className="p-4 font-semibold">Anotações</th>}
                                <th className="p-4 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rituals.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(item => (
                                <tr key={item.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4">{item.name}</td>
                                    <td className="p-4">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4">{item.leader}</td>
                                    {hasNotesAccess && <td className="p-4 whitespace-pre-wrap">{item.notes}</td>}
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenModal(item)} className="text-accent hover:text-primary p-1" aria-label={`Editar ${item.name}`}><ion-icon name="create-outline" className="text-xl"></ion-icon></button>
                                            <button onClick={() => openDeleteConfirm(item)} className="text-error hover:text-red-700 p-1" aria-label={`Excluir ${item.name}`}><ion-icon name="trash-outline" className="text-xl"></ion-icon></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <RitualFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} item={itemToEdit} />
            
            {itemToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-gray-900 dark:text-slate-50" role="alertdialog">
                        <h2 className="text-2xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">Deseja excluir o ritual <span className="font-bold text-gray-900 dark:text-slate-50">{itemToDelete.name}</span>?</p>
                         <div className="flex justify-end space-x-4">
                            <button onClick={closeDeleteConfirm} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Cancelar</button>
                            <button onClick={handleDeleteItem} className="py-2 px-4 bg-error text-white font-semibold rounded-lg hover:bg-red-700">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
};


// --- Entities Management Page ---
interface EntityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemData: Omit<Entity, 'id'> & { id?: string }) => void;
    item: Entity | null;
    currentUser: User | null;
    users: User[];
}

const EntityFormModal: React.FC<EntityFormModalProps> = ({ isOpen, onClose, onSave, item, currentUser, users }) => {
    const isEditing = !!item;
    const hasFullAccess = currentUser && [Role.ADMIN, Role.DIRECTOR, Role.MAE_DE_SANTO].includes(currentUser.role);
    
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        mediumId: '',
        candle: '',
        clothing: '',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    name: item.name,
                    type: item.type,
                    mediumId: item.mediumId,
                    candle: item.candle,
                    clothing: item.clothing,
                    notes: item.notes,
                });
            } else {
                setFormData({
                    name: '',
                    type: '',
                    mediumId: hasFullAccess ? '' : (currentUser?.id || ''),
                    candle: '',
                    clothing: '',
                    notes: '',
                });
            }
        }
    }, [isOpen, item, isEditing, currentUser, hasFullAccess]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: item?.id });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto text-gray-900 dark:text-slate-50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{isEditing ? 'Editar Entidade' : 'Adicionar Nova Entidade'}</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                        <ion-icon name="close-outline" className="text-3xl"></ion-icon>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Nome da Entidade</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Tipo (Ex: Caboclo, Exu)</label>
                            <input type="text" name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Médium</label>
                            <select name="mediumId" value={formData.mediumId} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-200 dark:disabled:bg-slate-600" required disabled={!hasFullAccess}>
                               {hasFullAccess ? (
                                    <>
                                        <option value="" disabled>Selecione um médium</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </>
                               ) : (
                                    currentUser && <option key={currentUser.id} value={currentUser.id}>{currentUser.name}</option>
                               )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Vela (Cor)</label>
                            <input type="text" name="candle" value={formData.candle} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Vestimenta</label>
                        <textarea name="clothing" value={formData.clothing} onChange={handleChange} rows={3} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Observações</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">{label}</h3>
        <p className="whitespace-pre-wrap">{value}</p>
    </div>
);

const EntityDetailModal: React.FC<{ item: Entity; mediumName: string; onClose: () => void; }> = ({ item, mediumName, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50">{item.name}</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                        <ion-icon name="close-outline" className="text-3xl"></ion-icon>
                    </button>
                </div>
                <div className="space-y-4 text-gray-600 dark:text-slate-400">
                    <DetailItem label="Tipo" value={item.type} />
                    <DetailItem label="Médium" value={mediumName} />
                    <DetailItem label="Vela (Cor)" value={item.candle || 'Não informado'} />
                    <DetailItem label="Vestimenta" value={item.clothing || 'Não informado'} />
                    <DetailItem label="Observações" value={item.notes || 'Nenhuma'} />
                </div>
                <div className="flex justify-end mt-8">
                    <button onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition">Fechar</button>
                </div>
            </div>
        </div>
    );
};

const Entities = () => {
    const { entities, users, addEntity, updateEntity, deleteEntity } = useData();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Entity | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Entity | null>(null);
    const [entityToView, setEntityToView] = useState<Entity | null>(null);
    
    const userMap = new Map(users.map(user => [user.id, user.name]));

    const hasFullAccess = user && [Role.ADMIN, Role.DIRECTOR, Role.MAE_DE_SANTO].includes(user.role);
    const displayedEntities = hasFullAccess ? entities : entities.filter(e => e.mediumId === user?.id);

    const handleOpenModal = (item: Entity | null) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setItemToEdit(null);
    };

    const handleSaveItem = (itemData: Omit<Entity, 'id'> & { id?: string }) => {
        if (itemToEdit && itemData.id) {
            updateEntity({ ...itemData, id: itemData.id });
        } else {
            const { id, ...newItemData } = itemData;
            addEntity(newItemData);
        }
        handleCloseModal();
    };

    const openDeleteConfirm = (item: Entity) => setItemToDelete(item);
    const closeDeleteConfirm = () => setItemToDelete(null);

    const handleDeleteItem = () => {
        if (itemToDelete) {
            deleteEntity(itemToDelete.id);
            closeDeleteConfirm();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">Gerenciamento de Entidades</h1>
                <button onClick={() => handleOpenModal(null)} className="flex items-center bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">
                    <ion-icon name="add-outline" className="mr-2 text-xl"></ion-icon>
                    Adicionar Entidade
                </button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="p-4 font-semibold">Nome</th>
                                <th className="p-4 font-semibold">Tipo</th>
                                <th className="p-4 font-semibold">Médium</th>
                                <th className="p-4 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedEntities.map(item => (
                                <tr key={item.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4">
                                        <button 
                                            onClick={() => setEntityToView(item)} 
                                            className="font-medium text-gray-900 dark:text-slate-50 hover:text-accent transition-colors cursor-pointer hover:underline"
                                        >
                                            {item.name}
                                        </button>
                                    </td>
                                    <td className="p-4">{item.type}</td>
                                    <td className="p-4">{userMap.get(item.mediumId) || 'Desconhecido'}</td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenModal(item)} className="text-accent hover:text-primary p-1" aria-label={`Editar ${item.name}`}><ion-icon name="create-outline" className="text-xl"></ion-icon></button>
                                            <button onClick={() => openDeleteConfirm(item)} className="text-error hover:text-red-700 p-1" aria-label={`Excluir ${item.name}`}><ion-icon name="trash-outline" className="text-xl"></ion-icon></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <EntityFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} item={itemToEdit} currentUser={user} users={users} />

            {entityToView && (
                <EntityDetailModal 
                    item={entityToView} 
                    onClose={() => setEntityToView(null)}
                    mediumName={userMap.get(entityToView.mediumId) || 'Desconhecido'}
                />
            )}
            
            {itemToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-gray-900 dark:text-slate-50" role="alertdialog">
                        <h2 className="text-2xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">Deseja excluir a entidade <span className="font-bold text-gray-900 dark:text-slate-50">{itemToDelete.name}</span>?</p>
                         <div className="flex justify-end space-x-4">
                            <button onClick={closeDeleteConfirm} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Cancelar</button>
                            <button onClick={handleDeleteItem} className="py-2 px-4 bg-error text-white font-semibold rounded-lg hover:bg-red-700">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Day Note Modal for Calendar ---
interface DayNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { notes: string; urgency: 'high' | 'medium' | 'low' | 'none' }) => void;
    date: Date;
    initialNote?: DayNote | null;
}

const DayNoteModal: React.FC<DayNoteModalProps> = ({ isOpen, onClose, onSave, date, initialNote }) => {
    const [notes, setNotes] = useState('');
    const [urgency, setUrgency] = useState<'high' | 'medium' | 'low' | 'none'>('none');

    useEffect(() => {
        if (isOpen) {
            setNotes(initialNote?.notes || '');
            setUrgency(initialNote?.urgency || 'none');
        }
    }, [isOpen, initialNote]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ notes, urgency });
    };

    if (!isOpen) return null;

    const urgencyOptions = [
        { id: 'high', label: 'Urgente', color: 'bg-red-500', ringColor: 'focus:ring-red-500' },
        { id: 'medium', label: 'Atenção', color: 'bg-yellow-500', ringColor: 'focus:ring-yellow-500' },
        { id: 'low', label: 'Tranquilo', color: 'bg-green-500', ringColor: 'focus:ring-green-500' },
        { id: 'none', label: 'Nenhum', color: 'bg-gray-500 dark:bg-slate-600', ringColor: 'focus:ring-primary' },
    ] as const;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-lg text-gray-900 dark:text-slate-50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Notas para {date.toLocaleDateString('pt-BR')}</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><ion-icon name="close-outline" className="text-3xl"></ion-icon></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Observações</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Adicione suas anotações aqui..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Lembrete / Urgência</label>
                        <div className="flex space-x-4">
                            {urgencyOptions.map(option => (
                                <button
                                    type="button"
                                    key={option.id}
                                    onClick={() => setUrgency(option.id)}
                                    className={`w-full py-2 rounded-lg transition-all text-white font-semibold ${option.color} ${urgency === option.id ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ${option.ringColor}` : 'opacity-70 hover:opacity-100'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Calendar Page ---
const Calendar = () => {
    const { rituals, calendarEvents, dayNotes, upsertDayNote } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const combinedEvents = [
        ...rituals.map(r => ({ ...r, type: 'umbanda' as const, title: r.name, urgency: 'high' as const })),
        ...calendarEvents
    ];

    const eventColors: { [key: string]: string } = {
        umbanda: 'bg-primary/80',
        national: 'bg-yellow-500/80',
        state: 'bg-green-500/80',
        custom: 'bg-blue-500/80',
    };
    
    const urgencyColors: { [key: string]: string } = {
        high: 'bg-red-500 text-white',
        medium: 'bg-yellow-400 text-black',
        low: 'bg-green-500 text-white',
        none: '',
    };
    
    const dayNotesMap = new Map<string, DayNote>(dayNotes.map(note => [note.date, note]));
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const dates: Date[] = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        dates.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const getEventsForDay = (date: Date) => {
        return combinedEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getUTCFullYear() === date.getFullYear() &&
                   eventDate.getUTCMonth() === date.getMonth() &&
                   eventDate.getUTCDate() === date.getDate();
        });
    };
    
    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setIsNoteModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsNoteModalOpen(false);
        setSelectedDate(null);
    };

    const handleSaveNote = (data: { notes: string; urgency: 'high' | 'medium' | 'low' | 'none' }) => {
        if (selectedDate) {
            upsertDayNote({
                date: selectedDate.toISOString().split('T')[0],
                ...data,
            });
        }
        handleCloseModal();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">Calendário</h1>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                        <ion-icon name="chevron-back-outline" className="text-2xl"></ion-icon>
                    </button>
                    <h2 className="text-xl font-semibold capitalize">
                        {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                        <ion-icon name="chevron-forward-outline" className="text-2xl"></ion-icon>
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {daysOfWeek.map(dayName => (
                        <div key={dayName} className="text-center font-medium text-gray-600 dark:text-slate-400 text-sm py-2">{dayName}</div>
                    ))}
                    {dates.map((date, index) => {
                        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                        const isToday = new Date().toDateString() === date.toDateString();
                        const dayEvents = getEventsForDay(date);
                        
                        const dayNote = dayNotesMap.get(date.toISOString().split('T')[0]);
                        const dayColorClass = dayNote && dayNote.urgency !== 'none' ? urgencyColors[dayNote.urgency] : '';
                        const hasNotes = dayNote && dayNote.notes;

                        let conditionalClasses = '';
                        if (dayColorClass) {
                            conditionalClasses = dayColorClass;
                        } else {
                            conditionalClasses = isCurrentMonth
                                ? 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                : 'bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700';
                        }

                        return (
                            <div 
                                key={index} 
                                className={`relative border border-gray-200 dark:border-slate-700 h-28 md:h-36 flex flex-col p-2 transition-colors duration-200 cursor-pointer ${conditionalClasses}`}
                                onClick={() => handleDayClick(date)}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`font-bold ${isToday ? 'bg-secondary text-gray-800 rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>{date.getDate()}</span>
                                    {hasNotes && <ion-icon name="document-text-outline" className="text-xs text-accent"></ion-icon>}
                                </div>
                                <div className="flex-grow overflow-y-auto mt-1 space-y-1 text-xs">
                                    {dayEvents.map(event => (
                                         <div key={event.id} title={event.title} className={`${eventColors[event.type] || 'bg-gray-500'} text-white rounded px-1 py-0.5 truncate`}>
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
             {isNoteModalOpen && selectedDate && (
                <DayNoteModal
                    isOpen={isNoteModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveNote}
                    date={selectedDate}
                    initialNote={dayNotesMap.get(selectedDate.toISOString().split('T')[0])}
                />
            )}
        </div>
    );
};

// --- Settings Page ---
const Settings = () => {
    const { user, changePassword } = useAuth();
    const { theme, setTheme } = useTheme();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isResetModalOpen, setResetModalOpen] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
            return;
        }
        
        const result = changePassword(oldPassword, newPassword);
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if(result.success) {
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    const handleExportData = () => {
        const data: { [key: string]: any } = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('voxmind_')) {
                data[key] = JSON.parse(localStorage.getItem(key) || 'null');
            }
        }
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `voxmind_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFile(file);
            setImportModalOpen(true);
        }
    };

    const confirmImport = () => {
        if (!importFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('Falha ao ler o arquivo.');
                const data = JSON.parse(text);
                Object.keys(data).forEach(key => {
                    if (key.startsWith('voxmind_')) {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                    }
                });
                alert('Dados importados com sucesso! A aplicação será recarregada.');
                window.location.reload();
            } catch (err) {
                alert(`Erro ao importar dados: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setImportModalOpen(false);
                setImportFile(null);
            }
        };
        reader.readAsText(importFile);
    };

    const confirmReset = () => {
        if (resetConfirmText !== 'RESET') {
            alert('Texto de confirmação incorreto.');
            return;
        }
        
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('voxmind_')) {
                localStorage.removeItem(key);
            }
        });
        sessionStorage.removeItem('voxmind_user');
        alert('Aplicação resetada com sucesso! A página será recarregada.');
        window.location.reload();
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50 mb-6">Configurações</h1>
            <div className="space-y-8 max-w-4xl mx-auto">
                {/* Profile Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-slate-700 pb-2">Meu Perfil</h2>
                    <div className="mb-6">
                        <p><strong>Nome:</strong> {user?.name}</p>
                        <p><strong>Login:</strong> {user?.login}</p>
                        <p><strong>Email:</strong> {user?.email}</p>
                    </div>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <h3 className="font-semibold text-lg">Alterar Senha</h3>
                        {message.text && (
                            <p className={`${message.type === 'success' ? 'text-green-500' : 'text-red-500'} text-center p-2 rounded-md bg-gray-100 dark:bg-slate-700`}>
                                {message.text}
                            </p>
                        )}
                        <div>
                             <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Senha Atual</label>
                             <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Nova Senha</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Confirmar Nova Senha</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition">Salvar Nova Senha</button>
                        </div>
                    </form>
                </div>

                {/* Appearance Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-slate-700 pb-2">Aparência</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-4">Escolha o tema visual da aplicação.</p>
                     <div className="flex space-x-4">
                        <button onClick={() => setTheme('light')} className={`flex items-center gap-2 py-2 px-4 font-semibold rounded-lg transition w-32 justify-center ${theme === 'light' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-slate-700'}`}>
                           <ion-icon name="sunny-outline"></ion-icon> Claro
                        </button>
                        <button onClick={() => setTheme('dark')} className={`flex items-center gap-2 py-2 px-4 font-semibold rounded-lg transition w-32 justify-center ${theme === 'dark' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-slate-700'}`}>
                           <ion-icon name="moon-outline"></ion-icon> Escuro
                        </button>
                    </div>
                </div>
                
                {/* Data Management Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-slate-700 pb-2">Gerenciamento de Dados</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-4">Faça backup dos seus dados ou restaure a partir de um arquivo.</p>
                    <div className="flex space-x-4">
                        <button onClick={handleExportData} className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                            <ion-icon name="download-outline"></ion-icon>
                            Exportar Dados
                        </button>
                         <button onClick={handleImportClick} className="flex items-center gap-2 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
                             <ion-icon name="cloud-upload-outline"></ion-icon>
                            Importar Dados
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept=".json" />
                    </div>
                </div>

                {/* Danger Zone Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-red-500/50">
                    <h2 className="text-xl font-semibold text-red-500 dark:text-red-400 mb-2">Zona de Perigo</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-4">Esta ação é irreversível e irá apagar todos os dados da aplicação.</p>
                    <button onClick={() => setResetModalOpen(true)} className="py-2 px-4 bg-error text-white font-semibold rounded-lg hover:bg-red-700 transition">
                        Resetar Aplicação
                    </button>
                </div>
            </div>

            {/* Import Confirmation Modal */}
            {isImportModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-gray-900 dark:text-slate-50">
                        <h2 className="text-2xl font-bold mb-4">Confirmar Importação</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">
                            Você tem certeza que deseja importar o arquivo <span className="font-bold text-gray-900 dark:text-slate-50">{importFile?.name}</span>? Todos os dados atuais serão <span className="font-bold text-error">sobrescritos</span>.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={() => { setImportModalOpen(false); setImportFile(null); }} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Cancelar</button>
                            <button onClick={confirmImport} className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus">Importar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Confirmation Modal */}
            {isResetModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-gray-900 dark:text-slate-50">
                        <h2 className="text-2xl font-bold text-error mb-4">Resetar Aplicação</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-4">
                            Esta ação é <span className="font-bold">irreversível</span>. Todos os usuários, transações, itens e configurações serão permanentemente excluídos.
                        </p>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">
                            Para confirmar, digite <strong className="text-gray-900 dark:text-slate-50">RESET</strong> no campo abaixo.
                        </p>
                        <input 
                            type="text" 
                            value={resetConfirmText}
                            onChange={(e) => setResetConfirmText(e.target.value)}
                            className="w-full px-3 py-2 mt-1 mb-6 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-error"
                        />
                        <div className="flex justify-end space-x-4">
                            <button onClick={() => { setResetModalOpen(false); setResetConfirmText(''); }} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Cancelar</button>
                            <button onClick={confirmReset} className="py-2 px-4 bg-error text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={resetConfirmText !== 'RESET'}>
                                Eu entendo, resetar tudo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Reports Page ---
const Reports = () => {
    type Tab = 'users' | 'inventory' | 'finance' | 'rituals' | 'entities';
    const reportTabs: { id: Tab; label: string }[] = [
        { id: 'users', label: 'Usuários' },
        { id: 'inventory', label: 'Inventário' },
        { id: 'finance', label: 'Financeiro' },
        { id: 'rituals', label: 'Rituais' },
        { id: 'entities', label: 'Entidades' },
    ];
    
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', userId: 'all', category: '' });
    const [reportData, setReportData] = useState<any[] | null>(null);
    const data = useData();

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const generateReport = () => {
        let result: any[] = [];
        const { startDate, endDate, userId, category } = filters;

        const checkDate = (itemDate: string) => {
            if (!startDate || !endDate) return true;
            const itemTime = new Date(itemDate).getTime();
            const startTime = new Date(startDate).getTime();
            const endTime = new Date(endDate).getTime() + 86399999; // include full end day
            return itemTime >= startTime && itemTime <= endTime;
        };

        switch (activeTab) {
            case 'users':
                result = data.users;
                break;
            case 'inventory':
                 result = data.inventory.filter(item => 
                    category ? item.category.toLowerCase().includes(category.toLowerCase()) : true
                );
                break;
            case 'finance':
                result = data.transactions.filter(t => checkDate(t.date));
                break;
            case 'rituals':
                result = data.rituals.filter(r => checkDate(r.date));
                break;
            case 'entities':
                result = data.entities.filter(e =>
                    (userId === 'all' || e.mediumId === userId) &&
                    (category ? e.type.toLowerCase().includes(category.toLowerCase()) : true)
                );
                break;
        }
        setReportData(result);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPdf = () => {
        const doc = new (window as any).jspdf.jsPDF();
        const table = document.getElementById('report-table');
        if (!table) return;

        doc.autoTable({ html: '#report-table' });
        doc.save(`relatorio_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const renderFilters = () => {
        const needsDateFilter = activeTab === 'finance' || activeTab === 'rituals';
        const needsUserFilter = activeTab === 'entities';
        const needsCategoryFilter = activeTab === 'inventory' || activeTab === 'entities';

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {needsDateFilter && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Data Inicial</label>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Data Final</label>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md" />
                        </div>
                    </>
                )}
                {needsUserFilter && (
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Médium</label>
                        <select name="userId" value={filters.userId} onChange={handleFilterChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md">
                            <option value="all">Todos</option>
                            {data.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                )}
                {needsCategoryFilter && (
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Categoria/Tipo</label>
                        <input type="text" name="category" value={filters.category} onChange={handleFilterChange} placeholder="Filtrar por nome..." className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md" />
                    </div>
                )}
            </div>
        );
    };

    const renderTable = () => {
        if (!reportData) return <p className="text-center text-gray-500 dark:text-slate-400 p-8">Gere um relatório para visualizar os dados.</p>;
        if (reportData.length === 0) return <p className="text-center text-gray-500 dark:text-slate-400 p-8">Nenhum dado encontrado para os filtros selecionados.</p>;

        let headers: string[] = [];
        let rows: (string | number)[][] = [];
        
        switch (activeTab) {
            case 'users':
                headers = ['Nome', 'Login', 'Email', 'Função', 'Categoria'];
                rows = reportData.map(u => [u.name, u.login, u.email, u.role, u.category]);
                break;
            case 'inventory':
                headers = ['Nome', 'SKU', 'Categoria', 'Quantidade'];
                rows = reportData.map(i => [i.name, i.sku, i.category, i.quantity]);
                break;
            case 'finance':
                 headers = ['Data', 'Descrição', 'Tipo', 'Valor'];
                 rows = reportData.map(t => [
                     new Date(t.date).toLocaleDateString('pt-BR'),
                     t.description,
                     t.type === 'income' ? 'Receita' : 'Despesa',
                     t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                 ]);
                break;
            case 'rituals':
                headers = ['Data', 'Nome', 'Líder'];
                rows = reportData.map(r => [new Date(r.date).toLocaleDateString('pt-BR'), r.name, r.leader]);
                break;
            case 'entities':
                const userMap = new Map(data.users.map(u => [u.id, u.name]));
                headers = ['Nome', 'Tipo', 'Médium', 'Vela', 'Vestimenta'];
                rows = reportData.map(e => [e.name, e.type, userMap.get(e.mediumId) || 'N/A', e.candle, e.clothing]);
                break;
        }

        return (
            <div className="overflow-x-auto">
                <table id="report-table" className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            {headers.map(h => <th key={h} className="p-4 font-semibold">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                {row.map((cell, cellIndex) => <td key={cellIndex} className="p-4">{cell}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50 mb-6">Relatórios</h1>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
                    <nav className="flex space-x-4">
                        {reportTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setReportData(null); setFilters({ startDate: '', endDate: '', userId: 'all', category: '' }); }}
                                className={`py-2 px-4 font-semibold rounded-t-lg transition-colors ${activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="no-print">
                    <h2 className="text-xl font-semibold mb-4">Filtros</h2>
                    {renderFilters()}
                    <button onClick={generateReport} className="py-2 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition">
                        Gerar Relatório
                    </button>
                </div>

                {reportData && (
                    <div id="print-area" className="mt-8">
                        <div className="flex justify-between items-center mb-4 no-print">
                             <h2 className="text-xl font-semibold">Resultados</h2>
                             <div className="flex space-x-4">
                                <button onClick={handlePrint} className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                                    <ion-icon name="print-outline"></ion-icon> Imprimir
                                </button>
                                <button onClick={handleExportPdf} className="flex items-center gap-2 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
                                    <ion-icon name="download-outline"></ion-icon> Exportar PDF
                                </button>
                             </div>
                        </div>
                        {renderTable()}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Notebook Page ---
interface GiraNoteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemData: Omit<GiraNote, 'id' | 'camboneId'> & { id?: string }) => void;
    item: GiraNote | null;
    users: User[];
    entities: Entity[];
}

const GiraNoteFormModal: React.FC<GiraNoteFormModalProps> = ({ isOpen, onClose, onSave, item, users, entities }) => {
    const isEditing = !!item;
    
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        entityId: '',
        mediumId: '',
        consulenteName: '',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    date: new Date(item.date).toISOString().split('T')[0],
                    entityId: item.entityId,
                    mediumId: item.mediumId,
                    consulenteName: item.consulenteName,
                    notes: item.notes,
                });
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    entityId: '',
                    mediumId: '',
                    consulenteName: '',
                    notes: '',
                });
            }
        }
    }, [isOpen, item, isEditing]);
    
    useEffect(() => {
        if (formData.entityId && formData.mediumId) {
            const entityBelongsToMedium = entities.some(e => e.id === formData.entityId && e.mediumId === formData.mediumId);
            if (!entityBelongsToMedium) {
                setFormData(prev => ({ ...prev, entityId: '' }));
            }
        }
    }, [formData.mediumId, formData.entityId, entities]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: item?.id });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto text-gray-900 dark:text-slate-50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{isEditing ? 'Editar Anotação' : 'Adicionar Anotação da Gira'}</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                        <ion-icon name="close-outline" className="text-3xl"></ion-icon>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Data</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Nome do Consulente</label>
                            <input type="text" name="consulenteName" value={formData.consulenteName} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Médium</label>
                            <select name="mediumId" value={formData.mediumId} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required>
                                <option value="" disabled>Selecione um médium</option>
                                {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Entidade</label>
                             <select name="entityId" value={formData.entityId} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required>
                                <option value="" disabled>Selecione uma entidade</option>
                                {entities.filter(e => e.mediumId === formData.mediumId).map(entity => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Anotações</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={5} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required></textarea>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Notebook = () => {
    const { giraNotes, users, entities, addGiraNote, updateGiraNote, deleteGiraNote } = useData();
    const { user } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<GiraNote | null>(null);
    const [itemToDelete, setItemToDelete] = useState<GiraNote | null>(null);

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    const entityMap = useMemo(() => new Map(entities.map(e => [e.id, e.name])), [entities]);
    
    const canManageNotes = user && ([Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR].includes(user.role) || (user.category && user.category.toLowerCase() === 'cambone'));
    
    const handleOpenModal = (item: GiraNote | null) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setItemToEdit(null);
    };

    const handleSaveItem = (itemData: Omit<GiraNote, 'id' | 'camboneId'> & { id?: string }) => {
        if (!user) return;
        const dataWithCambone = { ...itemData, camboneId: user.id, date: new Date(itemData.date).toISOString() };

        if (itemToEdit && itemData.id) {
            updateGiraNote({ ...dataWithCambone, id: itemData.id });
        } else {
            const { id, ...newItemData } = dataWithCambone;
            addGiraNote(newItemData);
        }
        handleCloseModal();
    };
    
    const openDeleteConfirm = (item: GiraNote) => setItemToDelete(item);
    const closeDeleteConfirm = () => setItemToDelete(null);

    const handleDeleteItem = () => {
        if (itemToDelete) {
            deleteGiraNote(itemToDelete.id);
            closeDeleteConfirm();
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">Caderno de Notas da Gira</h1>
                {canManageNotes && (
                    <button onClick={() => handleOpenModal(null)} className="flex items-center bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition">
                        <ion-icon name="add-outline" className="mr-2 text-xl"></ion-icon>
                        Adicionar Anotação
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="p-4 font-semibold">Data</th>
                                <th className="p-4 font-semibold">Consulente</th>
                                <th className="p-4 font-semibold">Médium</th>
                                <th className="p-4 font-semibold">Entidade</th>
                                <th className="p-4 font-semibold">Anotações</th>
                                {canManageNotes && <th className="p-4 font-semibold">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {giraNotes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                                <tr key={item.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4">{item.consulenteName}</td>
                                    <td className="p-4">{userMap.get(item.mediumId) || 'Desconhecido'}</td>
                                    <td className="p-4">{entityMap.get(item.entityId) || 'Desconhecido'}</td>
                                    <td className="p-4 whitespace-pre-wrap">{item.notes}</td>
                                    {canManageNotes && (
                                        <td className="p-4">
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleOpenModal(item)} className="text-accent hover:text-primary p-1" aria-label={`Editar nota de ${item.consulenteName}`}><ion-icon name="create-outline" className="text-xl"></ion-icon></button>
                                                <button onClick={() => openDeleteConfirm(item)} className="text-error hover:text-red-700 p-1" aria-label={`Excluir nota de ${item.consulenteName}`}><ion-icon name="trash-outline" className="text-xl"></ion-icon></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <GiraNoteFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} item={itemToEdit} users={users} entities={entities}/>

            {itemToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-gray-900 dark:text-slate-50" role="alertdialog">
                        <h2 className="text-2xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">Deseja excluir a anotação para <span className="font-bold text-gray-900 dark:text-slate-50">{itemToDelete.consulenteName}</span>?</p>
                         <div className="flex justify-end space-x-4">
                            <button onClick={closeDeleteConfirm} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Cancelar</button>
                            <button onClick={handleDeleteItem} className="py-2 px-4 bg-error text-white font-semibold rounded-lg hover:bg-red-700">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
};


// --- Pontos Cantados Page ---
interface PontoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemData: Omit<Ponto, 'id'> & { id?: string }) => void;
    item: Ponto | null;
}

const PontoFormModal: React.FC<PontoFormModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const isEditing = !!item;
    
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        subcategory: '',
        lyrics: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    title: item.title,
                    category: item.category,
                    subcategory: item.subcategory,
                    lyrics: item.lyrics,
                });
            } else {
                setFormData({
                    title: '',
                    category: '',
                    subcategory: '',
                    lyrics: '',
                });
            }
        }
    }, [isOpen, item, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: item?.id });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto text-gray-900 dark:text-slate-50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{isEditing ? 'Editar Ponto' : 'Adicionar Novo Ponto'}</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                        <ion-icon name="close-outline" className="text-3xl"></ion-icon>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Título</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Categoria</label>
                            <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Subcategoria</label>
                            <input type="text" name="subcategory" value={formData.subcategory} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Letra</label>
                        <textarea name="lyrics" value={formData.lyrics} onChange={handleChange} rows={10} className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required></textarea>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Pontos = () => {
    const { pontos, addPonto, updatePonto, deletePonto } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
    const [expandedPontoId, setExpandedPontoId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pontoToEdit, setPontoToEdit] = useState<Ponto | null>(null);
    const [pontoToDelete, setPontoToDelete] = useState<Ponto | null>(null);

    const handleOpenModal = (ponto: Ponto | null) => {
        setPontoToEdit(ponto);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setPontoToEdit(null);
    };

    const handleSavePonto = (pontoData: Omit<Ponto, 'id'> & { id?: string }) => {
        if (pontoToEdit && pontoData.id) {
            updatePonto({ ...pontoData, id: pontoData.id });
        } else {
            const { id, ...newPontoData } = pontoData;
            addPonto(newPontoData);
        }
        handleCloseModal();
    };

    const openDeleteConfirm = (ponto: Ponto) => setPontoToDelete(ponto);
    const closeDeleteConfirm = () => setPontoToDelete(null);

    const handleDeletePonto = () => {
        if (pontoToDelete) {
            deletePonto(pontoToDelete.id);
            closeDeleteConfirm();
        }
    };


    const groupedPontos = useMemo(() => {
        return pontos.reduce((acc, ponto) => {
            const { category, subcategory } = ponto;
            if (!acc[category]) acc[category] = {};
            if (!acc[category][subcategory]) acc[category][subcategory] = [];
            acc[category][subcategory].push(ponto);
            return acc;
        }, {} as Record<string, Record<string, Ponto[]>>);
    }, [pontos]);

    const filteredPontos = useMemo(() => {
        if (!searchTerm) return [];
        return pontos.filter(ponto =>
            ponto.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ponto.lyrics.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [pontos, searchTerm]);

    const handleTogglePonto = (pontoId: string) => {
        setExpandedPontoId(prevId => (prevId === pontoId ? null : pontoId));
    };
    
    const handleCategorySelect = (category: string) => {
        setActiveCategory(cat => cat === category ? null : category);
        setActiveSubcategory(null);
        setExpandedPontoId(null);
    }

    const handleSubcategorySelect = (subcategory: string) => {
        setActiveSubcategory(sub => sub === subcategory ? null : subcategory);
        setExpandedPontoId(null);
    }
    
    const renderPontoList = (pontoList: Ponto[]) => (
        <div className="space-y-2">
            {pontoList.map(ponto => (
                <div key={ponto.id} className="border-b border-gray-200 dark:border-slate-700 last:border-b-0">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <button
                            onClick={() => handleTogglePonto(ponto.id)}
                            className="flex-grow text-left flex justify-between items-center pr-4"
                            aria-expanded={expandedPontoId === ponto.id}
                        >
                            <span className="font-semibold">{ponto.title}</span>
                            <ion-icon name={expandedPontoId === ponto.id ? 'chevron-up-outline' : 'chevron-down-outline'}></ion-icon>
                        </button>
                        <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-slate-600 pl-4">
                            <button onClick={() => handleOpenModal(ponto)} className="text-accent hover:text-primary p-1" aria-label={`Editar ${ponto.title}`}>
                                <ion-icon name="create-outline" className="text-xl"></ion-icon>
                            </button>
                            <button onClick={() => openDeleteConfirm(ponto)} className="text-error hover:text-red-700 p-1" aria-label={`Excluir ${ponto.title}`}>
                                <ion-icon name="trash-outline" className="text-xl"></ion-icon>
                            </button>
                        </div>
                    </div>
                    {expandedPontoId === ponto.id && (
                        <div className="p-4 bg-gray-50 dark:bg-slate-900/50">
                            <p className="whitespace-pre-line text-gray-700 dark:text-slate-300">{ponto.lyrics}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">Pontos Cantados</h1>
                 <button
                    onClick={() => handleOpenModal(null)}
                    className="flex items-center bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition duration-200"
                >
                    <ion-icon name="add-outline" className="mr-2 text-xl"></ion-icon>
                    Adicionar Ponto
                </button>
            </div>


            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Buscar por título ou letra..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-10 bg-white dark:bg-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <ion-icon name="search-outline" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></ion-icon>
            </div>

            {searchTerm ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                    {filteredPontos.length > 0 ? renderPontoList(filteredPontos) : <p className="p-8 text-center text-gray-500 dark:text-slate-400">Nenhum ponto encontrado.</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.keys(groupedPontos).sort().map(category => (
                        <div key={category} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                            <button
                                onClick={() => handleCategorySelect(category)}
                                className="w-full p-4 text-left font-bold text-lg flex justify-between items-center"
                                aria-expanded={activeCategory === category}
                            >
                                {category}
                                <ion-icon name={activeCategory === category ? 'chevron-up-outline' : 'chevron-down-outline'}></ion-icon>
                            </button>
                            {activeCategory === category && (
                                <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {Object.keys(groupedPontos[category]).sort().map(subcategory => (
                                            <button
                                                key={subcategory}
                                                onClick={() => handleSubcategorySelect(subcategory)}
                                                className={`p-3 rounded-lg text-sm font-semibold text-center transition ${activeSubcategory === subcategory ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                                            >
                                                {subcategory}
                                            </button>
                                        ))}
                                    </div>
                                    {activeSubcategory && groupedPontos[category][activeSubcategory] && (
                                        <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
                                            {renderPontoList(groupedPontos[category][activeSubcategory])}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <PontoFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSavePonto}
                item={pontoToEdit}
            />

            {pontoToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-gray-900 dark:text-slate-50" role="alertdialog">
                        <h2 className="text-2xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">Deseja excluir o ponto <span className="font-bold text-gray-900 dark:text-slate-50">{pontoToDelete.title}</span>?</p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={closeDeleteConfirm} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">Cancelar</button>
                            <button onClick={handleDeletePonto} className="py-2 px-4 bg-error text-white font-semibold rounded-lg hover:bg-red-700">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const NotFound = () => <div className="text-3xl font-bold text-center mt-20">404 - Página Não Encontrada</div>;


const Login = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = login(username, password);
        if (!success) {
            setError('Usuário ou senha inválidos.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-50">AXÉ GESTOR 3</h1>
                    <p className="mt-2 text-gray-600 dark:text-slate-400">Acesse seu painel de gerenciamento</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Usuário</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-md hover:bg-primary-focus transition duration-200">
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

const Setup = () => {
    const { setupAdmin } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setupAdmin(password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-50">Bem-vindo ao AXÉ GESTOR 3</h1>
                    <p className="mt-2 text-gray-600 dark:text-slate-400">Configure a senha do administrador para começar.</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-center">{error}</p>}
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Nova Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400">Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-md hover:bg-primary-focus transition duration-200">
                        Salvar e Continuar
                    </button>
                </form>
            </div>
        </div>
    );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-slate-900">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-slate-900 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void; }) => {
    const { user } = useAuth();
    const location = useLocation();

    const filteredPages = pages.filter(page => page.roles.includes(user?.role as Role));
    
    return (
        <>
            {/* Mobile overlay */}
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>

            <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col no-print`}>
                <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-slate-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">AXÉ GESTOR 3</h1>
                </div>
                <nav className="flex-1 mt-6 px-4">
                    {filteredPages.map((page) => (
                        <Link
                            key={page.path}
                            to={page.path}
                            className={`flex items-center px-4 py-2 mt-2 text-gray-600 dark:text-slate-400 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200 ${location.pathname === page.path ? 'bg-primary text-white' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <ion-icon name={page.icon} className="text-xl"></ion-icon>
                            <span className="ml-3">{page.name}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </>
    );
};

const Header = ({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void; }) => {
    const { user, logout } = useAuth();
    
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 no-print">
            <div className="flex items-center">
                <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none md:hidden">
                    <ion-icon name="menu-outline" className="text-2xl"></ion-icon>
                </button>
            </div>
            <div className="flex items-center">
                <span className="mr-4">Olá, {user?.name}</span>
                <button onClick={logout} className="flex items-center text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white focus:outline-none">
                     <ion-icon name="log-out-outline" className="text-2xl"></ion-icon>
                </button>
            </div>
        </header>
    );
};

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: Role[] }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" />;
    }
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" />;
    }
    return <Layout>{children}</Layout>;
};

function App() {
    return (
        <ThemeProvider>
            <DataProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </DataProvider>
        </ThemeProvider>
    );
}

const AppRoutes = () => {
    const { isInitialized, user, needsSetup } = useAuth();

    if (!isInitialized) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">Carregando...</div>;
    }

    return (
        <HashRouter>
            <Routes>
                {needsSetup ? (
                    <Route path="*" element={<Setup />} />
                ) : !user ? (
                    <Route path="*" element={<Login />} />
                ) : (
                    <>
                        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={Object.values(Role)}><Dashboard /></ProtectedRoute>} />
                        <Route path="/users" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Users /></ProtectedRoute>} />
                        <Route path="/inventory" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR]}><Inventory /></ProtectedRoute>} />
                        <Route path="/finance" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.DIRECTOR]}><Finance /></ProtectedRoute>} />
                        <Route path="/rituals" element={<ProtectedRoute allowedRoles={Object.values(Role)}><Rituals /></ProtectedRoute>} />
                        <Route path="/entities" element={<ProtectedRoute allowedRoles={Object.values(Role)}><Entities /></ProtectedRoute>} />
                        <Route path="/pontos" element={<ProtectedRoute allowedRoles={Object.values(Role)}><Pontos /></ProtectedRoute>} />
                        <Route path="/calendar" element={<ProtectedRoute allowedRoles={Object.values(Role)}><Calendar /></ProtectedRoute>} />
                        <Route path="/notebook" element={<ProtectedRoute allowedRoles={Object.values(Role)}><Notebook /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.MAE_DE_SANTO, Role.DIRECTOR]}><Reports /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Settings /></ProtectedRoute>} />
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        <Route path="*" element={<ProtectedRoute allowedRoles={Object.values(Role)}><NotFound /></ProtectedRoute>} />
                    </>
                )}
            </Routes>
        </HashRouter>
    );
};

export default App;