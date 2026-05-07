/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  FileText, 
  Settings, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  ArrowRightLeft, 
  Calendar,
  Info,
  ChevronLeft,
  Filter,
  CheckCircle2,
  Circle,
  ChevronDown,
  Database,
  GitGraph,
  FileUp,
  FileDown
} from 'lucide-react';

// --- Utilities ---
const MONTHS_LIST = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const downloadCSV = (filename: string, csvContent: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Types ---

type ProductType = 'NPO' | 'OPS' | 'PDS' | 'DISCOUNT_RATES' | 'LDM';

interface AssumptionItem {
  label: string;
  value: string;
  description?: string;
  hasDetails?: boolean;
}

interface ProductAssumptions {
  id: ProductType;
  title: string;
  items: AssumptionItem[];
}

interface CalcParameter {
  id: string;
  label: string;
  type: 'General' | 'СОЦ РОС' | 'ННПФ';
  method: string;
}

// --- Data ---

const NPO_CALC_PARAMS: CalcParameter[] = [
  { id: 'AdmGrMon', label: 'Месяц роста административных расходов', type: 'General', method: 'Выбор месяца из справочника месяцев' },
  { id: 'AdmGr', label: 'Годовой темп роста административных расходов', type: 'General', method: 'Брать из таблицы Ставки' },
  { id: 'AdmGrCd', label: 'Тип роста административных расходов', type: 'General', method: 'Выбор: Ежемесячно / Ежегодно' },
  { id: 'AdmSum', label: 'Годовая сумма административных расходов', type: 'General', method: 'Ввод суммы, неотрицательное число' },
  { id: 'AkvGrMon', label: 'Месяц роста косвенных аквизиционных расходов', type: 'General', method: 'Выбор месяца из справочника месяцев' },
  { id: 'AkvGr', label: 'Годовой темп роста косвенных аквизиционных расходов', type: 'General', method: 'Брать из таблицы Ставки' },
  { id: 'AkvGrCd', label: 'Тип роста косвенных аквизиционных расходов', type: 'General', method: 'Выбор: Ежемесячно / Ежегодно' },
  { id: 'AkvSum', label: 'Размер годовой суммы косвенных аквизиционных расходов', type: 'General', method: 'Ввод суммы, неотрицательное число' },
  { id: 'Termination', label: 'Тип расторжения', type: 'General', method: 'Выбор опции момента расторжения' },
  { id: 'TerminationSur', label: 'Вероятность расторжения', type: 'General', method: 'Ввод процента, от 0 до 100' },
  { id: 'TermMonth', label: 'Месяц расторжения договора', type: 'General', method: 'Выбор месяца, используется при задании расторжения в конкретный месяц' },
  { id: 'InvestMon', label: 'Месяц начисления доходности', type: 'General', method: 'Выбор месяца из справочника месяцев' },
  { id: 'InvestCd', label: 'Тип начисления доходности', type: 'General', method: 'Выбор: Ежемесячно / Ежегодно' },
  { id: 'Profit', label: 'Ставка индексации пенсии', type: 'General', method: 'Ввод коэффициента, неотрицательное число' },
  { id: 'IndexMon', label: 'Месяц индексации', type: 'General', method: 'Выбор месяца из справочника месяцев' },
  { id: 'IndexCd', label: 'Тип начисления индексации', type: 'General', method: 'Выбор: Ежемесячно / Ежегодно' },
  { id: 'AgeEnd', label: 'Максимальный возраст', type: 'General', method: 'Ввод целого числа, > 0' },
  { id: 'Gamma', label: 'Поправка к таблице смертности', type: 'General', method: 'Ввод коэффициента, > 0' },
  { id: 'Nspv', label: 'Срок выплаты срочной пенсии/пенсии до исчерпания', type: 'General', method: 'Ввод количества месяцев, неотрицательное целое' },
  { id: 'Contrib_flag', label: 'Прогноз взносов', type: 'General', method: 'Опция для прогноза (Y) или не прогноза (N) взносов' },
  
  // СОЦ РОС
  { id: 'GarantProfit', label: 'Грантированная ставка доходности', type: 'СОЦ РОС', method: 'Ввод процента, от 0 до 100' },
  { id: 'MinPeriod', label: 'Минимальный накопительный период', type: 'СОЦ РОС', method: 'Ввод количества лет, неотрицательное целое' },
  { id: 'DirAKVcoef', label: 'Коэффициент прямых аквизиционных расходов', type: 'СОЦ РОС', method: 'Ввод коэффициента, от 0 до 1' },
  { id: 'ContribYear', label: 'Размер годовой суммы взноса', type: 'СОЦ РОС', method: 'Ввод суммы, неотрицательное число' },
  { id: 'FreeBalanceYears', label: 'Количество лет выплат свободного остатка', type: 'СОЦ РОС', method: 'Выбор варианта из справочника' },
  
  // ННПФ
  { id: 'DeathTableType', label: 'Метод прогноза смертности', type: 'ННПФ', method: 'Справочник типа смертности' },
  { id: 'InterpolationType', label: 'Метод интерполяции', type: 'ННПФ', method: 'Справочник интерполяции' },
  { id: 'AgePensM', label: 'Пенсионный возраст (М)', type: 'ННПФ', method: 'Ввод числа' },
  { id: 'AgePensF', label: 'Пенсионный возраст (Ж)', type: 'ННПФ', method: 'Ввод числа' },
  { id: 'DayPay', label: 'День выплат', type: 'ННПФ', method: 'ввод числа и месяца' },
  { id: 'MinPens', label: 'Минимальная пенсия', type: 'ННПФ', method: 'Ввод числа' },
  { id: 'FirstPens', label: 'Первая пенсия', type: 'ННПФ', method: 'Ввод процента, от 0 до 100' },
  { id: 'ContribMax', label: 'Максимальный взнос', type: 'ННПФ', method: 'Ввод числа' },
  { id: 'EV_flag', label: 'Флаг единовременной выплаты', type: 'ННПФ', method: 'Опция для договоров на этапе накопления (Y/N)' },
  { id: 'VF_type', label: 'Опция оплаты УК и ВФ', type: 'ННПФ', method: 'Опция оплаты УК и ВФ (OLD2024 / NEW2024)' },
];

const GENERAL_PARAMS = {
  name: "Актуарный отчет 2026",
  reportingDate: "26.03.2026",
};

const ASSUMPTIONS: Record<ProductType, ProductAssumptions> = {
  NPO: {
    id: 'NPO',
    title: 'НПО (Негосударственное пенсионное обеспечение)',
    items: [
      { label: 'Параметры расчета', value: 'Параметры расчета НПО', description: 'Базовые константы для ставок и индексации.', hasDetails: true },
      { label: 'Понижающие коэффициенты', value: 'Пониж коэф смертности', description: 'Корректировка таблиц смертности для специфики фонда.', hasDetails: true },
      { label: 'Процент расходов УК, СД, АСВ', value: 'Процент расходов НПО', description: 'Административные и инвестиционные расходы.', hasDetails: true },
      { label: 'Вероятности расторжений', value: 'Вероятность расторжения', description: 'Статистика досрочного прекращения договоров.', hasDetails: true },
      { label: 'Таблица смертности', value: 'Таблица смертности', description: 'Актуарная таблица дожития.', hasDetails: true },
      { label: 'Таблица выхода на пенсию', value: 'Таблица выхода на пенсию', description: 'Распределение вероятностей наступления пенсионных оснований.', hasDetails: true },
      { label: 'Пожизненные тарифы', value: 'пожизненные тарифы', description: 'Актуарные стоимости для аннуитетных выплат.', hasDetails: true },
      { label: 'Срочные тарифы', value: 'Срочные тарифы', description: 'Выплаты на определенный срок.', hasDetails: true },
    ]
  },
// ... rest of the object
  OPS: {
    id: 'OPS',
    title: 'ОПС (Обязательное пенсионное страхование)',
    items: [
      { label: 'Параметры расчета', value: 'Параметры расчета ОПС', description: 'Нормативные параметры согласно законодательству.' },
      { label: 'Ставки', value: 'Ставки ОПС', description: 'Инвестиционные ожидания по портфелю ОПС.' },
      { label: 'Процент расходов УК, СД, АСВ', value: 'Процент расходов ОПС', description: 'Установленные лимиты на ведение дел.' },
      { label: 'Вероятность перевода в ПДС', value: 'Вероятность перевода в ПДС', description: 'Прогноз миграции клиентов в новый продукт ПДС.' },
      { label: 'Таблица смертности', value: 'Таблица смертности', description: 'Стандартная таблица для ОПС.', hasDetails: true },
      { label: 'Таблица выхода на пенсию', value: 'Таблица выхода на пенсию', description: 'Возрастные коэффициенты выхода на пенсию.', hasDetails: true },
      { label: 'Коэффициент обращения', value: 'Коэффициент обращения', description: 'Доля застрахованных лиц, обращающихся за выплатой.' },
    ]
  },
  PDS: {
    id: 'PDS',
    title: 'ПДС (Программа долгосрочных сбережений)',
    items: [
      { label: 'Параметры расчета', value: 'Параметры расчета ПДС общий', description: 'Общие вводные для новой программы сбережений.' },
      { label: 'АППониж. Коэффициент к ИД 1 тип', value: 'Пониж коэф 1', description: 'Корректировка инвестдохода для 1 типа.' },
      { label: 'АППониж. Коэффициент к ИД 2 тип', value: 'Пониж коэф 2', description: 'Корректировка инвестдохода для 2 типа.' },
      { label: 'Ставки', value: 'Ставки ПДС', description: 'Целевые показатели доходности ПДС.' },
      { label: 'Процент расходов УК, СД, АСВ', value: 'Процент расходов ПДС', description: 'Структура издержек по программе.' },
      { label: 'Начисление ИД', value: 'Начисление ИД', description: 'Алгоритм распределения инвестиционного дохода.' },
      { label: 'Вероятность расторжения', value: 'Вероятность расторжения', description: 'Ожидаемый уровень оттока средств.', hasDetails: true },
      { label: 'Вероятность расторжения ОЖС', value: 'Вероят. расторжения ОЖС', description: 'Специфические риски для ОЖС.' },
      { label: 'Вероятность расторжения Трансфер', value: 'Вероят. расторжения Трансфер', description: 'Риски при переводе средств.' },
      { label: 'Таблица смертности', value: 'Таблица смертности', description: 'Базовая демография для ПДС.', hasDetails: true },
      { label: 'Таблица выхода на пенсию', value: 'Таблица выхода на пенсию', description: 'Условия получения выплат по ПДС.', hasDetails: true },
      { label: 'Вероятность выбора пенсии', value: 'Вероятность выбора пенсии', description: 'Предпочтения клиентов между единовременной и срочной выплатой.' },
      { label: 'Коэффициент обращения', value: 'Коэффициент обращения', description: 'Активность участников при достижении условий.' },
    ]
  },
  DISCOUNT_RATES: {
    id: 'DISCOUNT_RATES',
    title: 'Ставки',
    items: [
      { label: 'Ставки', value: 'Ставки НПО', description: 'Прогнозные ставки доходности на долгосрочный период.', hasDetails: true },
    ]
  },
  LDM: {
    id: 'LDM',
    title: 'Логическая модель данных (ЛМД)',
    items: []
  }
};

// --- Components ---

const SidebarItem = ({ 
  id, 
  label, 
  active, 
  onClick, 
  icon: Icon 
}: { 
  id: ProductType, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  icon: any
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const FilterToggle = ({ 
  label, 
  active, 
  onClick 
}: { 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
      active 
        ? 'bg-blue-600 border-blue-600 text-white' 
        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
    }`}
  >
    {active ? <CheckCircle2 size={14} /> : <Circle size={14} />}
    {label}
  </button>
);

const LDMView = () => {
  const [viewMode, setViewMode] = useState<'ER' | 'IDEF0'>('ER');

  const entities = [
    {
      name: 'CalculationParameters (Параметры расчета)',
      icon: Settings,
      color: 'bg-slate-900',
      description: 'Глобальные константы и алгоритмы расчета для актуарных моделей.',
      attributes: [
        { name: 'id', type: 'String (PK)', desc: 'Уникальный код параметра (напр. AdmGr)' },
        { name: 'label', type: 'String', desc: 'Наименование параметра для интерфейса' },
        { name: 'type', type: 'Enum', desc: 'Категория (General, СОЦ РОС, ННПФ)' },
        { name: 'method', type: 'String', desc: 'Выбранный метод заполнения (dropdown)' },
        { name: 'value', type: 'Decimal', desc: 'Текущее числовое или флажковое значение' }
      ]
    },
    {
      name: 'MortalityTable (Таблица смертности)',
      icon: Users,
      color: 'bg-indigo-700',
      description: 'Демографические данные: вероятности смерти (qx) и дожития (lx).',
      attributes: [
        { name: 'age_year', type: 'Int (PK)', desc: 'Возраст участника в полных годах' },
        { name: 'age_month', type: 'Int (PK)', desc: 'Доп. детализация возраста в месяцах' },
        { name: 'qx_male', type: 'Decimal', desc: 'Вероятность смерти (мужчины)' },
        { name: 'qx_female', type: 'Decimal', desc: 'Вероятность смерти (женщины)' },
        { name: 'lx_male', type: 'Decimal', desc: 'Число доживших (мужчины)' },
        { name: 'lx_female', type: 'Decimal', desc: 'Число доживших (женщины)' }
      ]
    },
    {
      name: 'DiscountRates (Ставки)',
      icon: BarChart3,
      color: 'bg-emerald-700',
      description: 'Прогнозные финансовые показатели и доходности по периодам.',
      attributes: [
        { name: 'period_key', type: 'String (PK)', desc: 'Ключ периода (2024 или 2024-01)' },
        { name: 'index_1', type: 'Decimal', desc: 'Ставка индексации первого типа' },
        { name: 'admin_growth', type: 'Decimal', desc: 'Темп роста адм. расходов' },
        { name: 'index_2', type: 'Decimal', desc: 'Ставка индексации второго типа' },
        { name: 'gross_yield', type: 'Decimal', desc: 'Ожидаемая доходность брутто' },
        { name: 'net_yield', type: 'Decimal', desc: 'Ожидаемая доходность нетто' },
        { name: 'yield_rate', type: 'Decimal', desc: 'Итоговая ставка доходности' }
      ]
    },
    {
      name: 'RetirementTable (Выход на пенсию)',
      icon: Calendar,
      color: 'bg-orange-600',
      description: 'Вероятности наступления пенсионных оснований для участников.',
      attributes: [
        { name: 'age', type: 'Int (PK)', desc: 'Целевой возраст участника' },
        { name: 'gender', type: 'Enum (PK)', desc: 'Пол (М/Ж)' },
        { name: 'retirement_type', type: 'Enum (PK)', desc: 'Тип (Накопительная / Не накоп.)' },
        { name: 'probability', type: 'Decimal', desc: 'Вероятность наступления основания' }
      ]
    },
    {
      name: 'TerminationTable (Расторжения)',
      icon: ShieldCheck,
      color: 'bg-rose-700',
      description: 'Вероятности досрочного прекращения договоров по стажу/сроку.',
      attributes: [
        { name: 'term_year', type: 'Int (PK)', desc: 'Срок действия договора (лет)' },
        { name: 'prob_surrender', type: 'Decimal', desc: 'Вероятность расторжения' }
      ]
    },
    {
      name: 'ExpenseRates (Нормативы расходов)',
      icon: TrendingUp,
      color: 'bg-blue-700',
      description: 'Комиссии и отчисления (УК, СД, АСВ) по годам.',
      attributes: [
        { name: 'year', type: 'Int (PK)', desc: 'Календарный год действия' },
        { name: 'mgmt_fee', type: 'Decimal', desc: 'Расходы на управление (УК)' },
        { name: 'dep_fee', type: 'Decimal', desc: 'Расходы на спецдепозитарий (СД)' },
        { name: 'asv_fee', type: 'Decimal', desc: 'Отчисления в АСВ' }
      ]
    }
  ];

  const ArrowRight = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );

  const ArrowDown = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );

  const ArrowUp = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8 max-w-7xl mx-auto pb-20"
    >
      <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-10 py-12 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12 select-none pointer-events-none">
            <Database size={180} />
          </div>
          
          <div className="relative z-10 flex items-center gap-8">
            <div className="bg-blue-500 p-5 rounded-3xl shadow-2xl shadow-blue-500/40 transform -rotate-3">
              <GitGraph size={40} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-3 border border-blue-500/30">
                System Model v2.5
              </div>
              <h3 className="text-4xl font-black tracking-tight mb-2">Логическая и функциональная модель</h3>
              <p className="text-slate-400 font-medium text-lg max-w-xl leading-relaxed">
                Архитектура системы в нотациях ER и IDEF0.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            <button 
              onClick={() => setViewMode('ER')}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'ER' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
            >
              ER-Схема
            </button>
            <button 
              onClick={() => setViewMode('IDEF0')}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'IDEF0' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
            >
              IDEF0
            </button>
          </div>
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {viewMode === 'ER' ? (
              <motion.div 
                key="er"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
              >
                {entities.map((entity, idx) => (
                  <div 
                    key={idx} 
                    className="group bg-white border border-slate-200 rounded-[2rem] overflow-hidden hover:border-blue-500 hover:ring-[12px] hover:ring-blue-50 transition-all duration-500 flex flex-col shadow-sm"
                  >
                    <div className={`${entity.color} p-6 flex items-center justify-between text-white relative`}>
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                          <entity.icon size={22} />
                        </div>
                        <div>
                          <span className="font-black text-xs uppercase tracking-widest block opacity-70 mb-0.5">Entity Table</span>
                          <span className="font-black tracking-tight text-sm">{entity.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 italic">
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        "{entity.description}"
                      </p>
                    </div>

                    <div className="flex-1 overflow-x-auto p-2">
                      <table className="w-full text-[11px] border-separate border-spacing-y-1">
                        <thead>
                          <tr>
                            <th className="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-100">Attribute</th>
                            <th className="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-100">Type</th>
                            <th className="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-100">Info</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {entity.attributes.map((attr, aIdx) => (
                            <tr key={aIdx} className="hover:bg-slate-50/80 transition-colors group/row">
                              <td className="px-4 py-3">
                                <span className="font-mono font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 block w-fit">
                                  {attr.name}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[9px] font-black uppercase tracking-tight px-2 py-1 rounded-full border ${
                                  attr.type.includes('(PK)') 
                                    ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                    : 'bg-blue-50 text-blue-600 border-blue-200'
                                }`}>
                                  {attr.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 font-bold leading-tight text-[10px]">
                                {attr.desc}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex -space-x-1">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-4 h-4 rounded-full border-2 border-white bg-slate-200" />
                        ))}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata Loaded</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="idef"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-900/5 rounded-[3rem] p-8 md:p-16 border border-slate-200 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                
                <div className="relative z-10 grid grid-cols-3 grid-rows-3 gap-4 items-center justify-items-center min-h-[600px]">
                  {/* Inputs */}
                  <div className="col-start-1 row-start-2 space-y-12 w-full text-right pr-12">
                    {[
                      { label: "Стат. данные", desc: "Смертность, стаж и др." },
                      { label: "Макро-прогнозы", desc: "Инфляция, ставки ЦБ" },
                      { label: "Данные рынка", desc: "Доходности индекса" }
                    ].map((inp, i) => (
                      <div key={i} className="flex flex-col items-end gap-1 group">
                        <div className="flex items-center justify-end gap-4">
                          <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600 transition-colors">{inp.label}</span>
                          <ArrowRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" size={18} />
                        </div>
                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{inp.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Main Process Box */}
                  <div className="col-start-2 row-start-2 w-full max-w-sm aspect-video bg-white border-[6px] border-slate-900 rounded-[2rem] shadow-[24px_24px_0px_0px_rgba(15,23,42,0.05)] flex flex-col items-center justify-center p-10 text-center space-y-4 relative z-20 hover:scale-105 transition-transform duration-500">
                    <span className="text-[12px] font-black text-slate-300 absolute top-6 left-6 tracking-[0.3em]">A0</span>
                    <div className="bg-blue-500/10 p-4 rounded-3xl text-blue-600">
                      <Database size={32} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase tracking-tighter text-xl leading-none mb-1">Определение актуарных предположений</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Процесс формирования параметров</p>
                    </div>
                  </div>

                  {/* Outputs */}
                  <div className="col-start-3 row-start-2 space-y-12 w-full text-left pl-12">
                    {[
                      { label: "Утв. сетка ставок", desc: "Для ставок" },
                      { label: "Прогноз обязательств", desc: "Резервы НПО/ОПС" },
                      { label: "Отчетность", desc: "Актарное заключение" }
                    ].map((out, i) => (
                      <div key={i} className="flex flex-col items-start gap-1 group">
                        <div className="flex items-center gap-4">
                          <ArrowRight className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" size={18} />
                          <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-emerald-500 transition-colors">{out.label}</span>
                        </div>
                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{out.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Controls (Top) */}
                  <div className="col-start-2 row-start-1 flex flex-col items-center gap-8 h-full pt-8">
                    {[
                      { label: "Законодательство РФ (210-ФЗ)", side: "center" },
                      { label: "Актуарная политика фонда", side: "center" }
                    ].map((ctrl, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 group">
                        <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-amber-600 transition-colors">{ctrl.label}</span>
                        <ArrowDown className="text-slate-300 group-hover:text-amber-600 group-hover:translate-y-1 transition-all" size={18} />
                      </div>
                    ))}
                  </div>

                  {/* Mechanisms (Bottom) */}
                  <div className="col-start-2 row-end-4 flex flex-col items-center gap-8 h-full justify-end pb-8">
                    {[
                      { label: "ПО: Актуарный комплекс", side: "bottom" },
                      { label: "Ответственный актуарий", side: "bottom" }
                    ].map((mech, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 group">
                        <ArrowUp className="text-slate-300 group-hover:text-indigo-600 group-hover:-translate-y-1 transition-all" size={18} />
                        <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-600 transition-colors">{mech.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ProductType>('NPO');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  // Filters for NPO Calc Params
  const [filters, setFilters] = useState({
    socRos: true,
    nnpf: true
  });

  // Parameters for Mortality Table
  const [mortalityParams, setMortalityParams] = useState({
    startAge: 0,
    step: 1,
    count: 100
  });

  // Parameters for NPO Calculation Parameters Table
  const [calcParamsData, setCalcParamsData] = useState<Record<string, {
    method: string;
    value: string;
  }>>({});

  const getCalcParamData = (id: string, defaultMethod: string) => {
    return calcParamsData[id] || { method: defaultMethod, value: '' };
  };

  const updateCalcParamData = (id: string, field: 'method' | 'value', val: string) => {
    setCalcParamsData(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { method: '', value: '' }),
        [field]: val
      }
    }));
  };

  const FILL_METHODS = [
    'Ручной ввод',
    'Из справочника',
    'Из таблицы "Ставки"',
    'Константа',
    'Формула',
    'Загрузка из файла'
  ];

  // Parameters for NPO Rates Table
  const [ratesParams, setRatesParams] = useState({
    startYear: 2024,
    step: 1,
    count: 3,
    viewMode: 'years' as 'years' | 'months',
    saveFor100Years: false
  });

  // Optional columns for NPO Rates
  const [ratesOptionalCols, setRatesOptionalCols] = useState({
    category: false,
    strategy: false,
    portfolio: false
  });

  // Data for NPO Rates Table
  const [ratesData, setRatesData] = useState<Record<string, {
    indexation1: string;
    adminGrowth: string;
    indexation2: string;
    grossYield: string;
    netYield: string;
    yieldRate: string;
  }>>({});

  const getRatesValue = (key: string, field: string, defaultValue: string) => {
    if (!ratesData[key]) {
      return defaultValue;
    }
    // @ts-ignore - dynamic access
    return ratesData[key][field] || defaultValue;
  };

  const updateRatesValue = (key: string, field: string, value: string) => {
    setRatesData(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {
          indexation1: '0.0400',
          adminGrowth: '0.0500',
          indexation2: '0.0400',
          grossYield: '0.0700',
          netYield: '0.0600',
          yieldRate: '0.0650',
        }),
        [field]: value
      }
    }));
  };

  const fillDown = (startKey: string, field: string, value: string) => {
    setRatesData(prev => {
      const next = { ...prev };
      const totalCount = ratesParams.saveFor100Years ? 100 : ratesParams.count;
      const keysToFill: string[] = [];

      if (ratesParams.viewMode === 'months') {
        for (let i = 0; i < totalCount; i++) {
          const totalMonths = (ratesParams.startYear * 12) + i;
          const year = Math.floor(totalMonths / 12);
          const month = (totalMonths % 12) + 1;
          keysToFill.push(`${year}-${month}`);
        }
      } else {
        for (let i = 0; i < totalCount; i++) {
          const year = ratesParams.startYear + (i * ratesParams.step);
          keysToFill.push(year.toString());
        }
      }

      const startIndex = keysToFill.indexOf(startKey);
      if (startIndex !== -1) {
        for (let i = startIndex; i < keysToFill.length; i++) {
          const key = keysToFill[i];
          next[key] = {
            ...(next[key] || {
              indexation1: '0.0400',
              adminGrowth: '0.0500',
              indexation2: '0.0400',
              grossYield: '0.0700',
              netYield: '0.0600',
              yieldRate: '0.0650',
            }),
            [field]: value
          };
        }
      }
      return next;
    });
  };

  // Parameters for NPO Expense Table
  const [expenseParams, setExpenseParams] = useState({
    startYear: 2024,
    step: 1,
    count: 30
  });

  // Optional columns for NPO Expense
  const [expenseOptionalCols, setExpenseOptionalCols] = useState({
    portfolio: false
  });

  // Parameters for Termination Probability Table
  const [terminationParams, setTerminationParams] = useState({
    startTerm: 1,
    step: 1,
    count: 30
  });

  // Parameters for Mortality Table (General)
  const [mortalityTableParams, setMortalityTableParams] = useState({
    startAge: 0,
    step: 1,
    count: 50,
    viewMode: 'years' as 'years' | 'months'
  });

  // Manual overrides for lx_male and lx_female
  // Key: age string (e.g. "60" or "60-5")
  const [mortalityManualLx, setMortalityManualLx] = useState<Record<string, { male?: string, female?: string }>>({});

  const getLxValue = (ageYears: number, ageMonths: number, gender: 'Муж' | 'Жен') => {
    const key = mortalityTableParams.viewMode === 'years' ? ageYears.toString() : `${ageYears}-${ageMonths}`;
    const manual = mortalityManualLx[key];
    const field = gender === 'Муж' ? 'male' : 'female';
    
    if (manual && manual[field] !== undefined) {
      return manual[field];
    }
    
    // Default generation logic
    return Math.floor(100000 * Math.exp(-ageYears / 80)).toString();
  };

  const updateLxValue = (ageYears: number, ageMonths: number, gender: 'Муж' | 'Жен', value: string) => {
    const key = mortalityTableParams.viewMode === 'years' ? ageYears.toString() : `${ageYears}-${ageMonths}`;
    const field = gender === 'Муж' ? 'male' : 'female';
    
    setMortalityManualLx(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value
      }
    }));
  };

  const resetMortalityLx = () => {
    setMortalityManualLx({});
  };

  // Parameters for Retirement Table (General)
  const [retirementParams, setRetirementParams] = useState({
    startAge: 55,
    step: 1,
    count: 20,
    type: 'accumulative' as 'accumulative' | 'non-accumulative',
    showOnlyFilled: false
  });

  const [retirementProbsAccum, setRetirementProbsAccum] = useState<Record<string, string>>({
    '60-М': '1.0',
    '55-Ж': '1.0'
  });
  const [retirementProbsNonAccum, setRetirementProbsNonAccum] = useState<Record<string, string>>({});
  
  // Overrides for Expenses
  const [expenseOverrides, setExpenseOverrides] = useState<Record<string, { uk_const?: string, uk_var?: string, asv?: string, sd?: string, vf_const?: string, vf_var?: string }>>({});

  // Overrides for Termination
  const [terminationOverrides, setTerminationOverrides] = useState<Record<string, string>>({});

  // Overrides for Mortality Reduction
  const [mortalityReductionOverrides, setMortalityReductionOverrides] = useState<Record<string, { male: string, female: string }>>({});

  // Overrides for Life Tariffs
  const [lifeTariffOverrides, setLifeTariffOverrides] = useState<Record<string, { male: string, female: string }>>({});

  // Overrides for Term Tariffs
  const [termTariffOverrides, setTermTariffOverrides] = useState<Record<string, { male: string, female: string }>>({});

  const getLifeTariffVal = (code: string, age: number) => {
    const key = `${code}-${age}`;
    return lifeTariffOverrides[key] || {
      male: (12.5 + (code.length * 0.1)).toFixed(4),
      female: (14.2 + (code.length * 0.1)).toFixed(4)
    };
  };

  const getTermTariffVal = (code: string, age: number, term: number) => {
    const key = `${code}-${age}-${term}`;
    return termTariffOverrides[key] || {
      male: (8.5 + (term * 0.2)).toFixed(4),
      female: (9.2 + (term * 0.2)).toFixed(4)
    };
  };

  const getMortalityReduction = (age: number) => {
    return mortalityReductionOverrides[age.toString()] || { 
      male: (1 - Math.exp(-age / 100)).toFixed(4), 
      female: (1 - Math.exp(-age / 110)).toFixed(4) 
    };
  };

  const getTerminationProb = (term: number) => {
    return terminationOverrides[term.toString()] || (0.15 * Math.exp(-term / 10)).toFixed(4);
  };

  const getRetirementProb = (age: number, gender: string) => {
    const data = retirementParams.type === 'accumulative' ? retirementProbsAccum : retirementProbsNonAccum;
    return data[`${age}-${gender}`] || '';
  };

  const updateRetirementProb = (age: number, gender: string, value: string) => {
    const setter = retirementParams.type === 'accumulative' ? setRetirementProbsAccum : setRetirementProbsNonAccum;
    setter(prev => ({
      ...prev,
      [`${age}-${gender}`]: value
    }));
  };

  // Parameters for Life Tariffs
  const [lifeTariffParams, setLifeTariffParams] = useState({
    age: 60,
    count: 26 // Number of schemes to show
  });

  // Parameters for Term Tariffs
  const [termTariffParams, setTermTariffParams] = useState({
    age: 60,
    term: 10,
    count: 15
  });

  const schemeCodes = [
    '1PPA', '2PPA', '3PPA', '4PPA', 'И1ст', 'И1стД', 'К1ст120', 'К1ст60', 
    'И1ст', 'И1стД', 'К1ст120', 'К1ст60', 'И2', 'И2Д', 'С4Д', 'С4', 
    'С6', 'С7', 'С9', 'С9.1', 'С1Р', 'С9.2', 'И2Р', 'ИЗР', 'ИЗРД', 'С4Р'
  ];

  const generatedMortalityRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < mortalityParams.count; i++) {
      const age = mortalityParams.startAge + (i * mortalityParams.step);
      const val = getMortalityReduction(age);
      rows.push({
        age,
        male: val.male,
        female: val.female
      });
    }
    return rows;
  }, [mortalityParams, mortalityReductionOverrides]);

  const filteredNpoParams = useMemo(() => {
// ... rest of the function
    return NPO_CALC_PARAMS.filter(param => {
      if (param.type === 'General') return true;
      if (param.type === 'СОЦ РОС' && filters.socRos) return true;
      if (param.type === 'ННПФ' && filters.nnpf) return true;
      return false;
    });
  }, [filters]);

  const handleItemClick = (item: AssumptionItem) => {
    if (item.hasDetails) {
      setShowDetails(item.value);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <TrendingUp size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ActuaryHub</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Продукты</p>
          <SidebarItem 
            id="NPO" 
            label="НПО" 
            active={activeTab === 'NPO'} 
            onClick={() => { setActiveTab('NPO'); setShowDetails(null); }}
            icon={ShieldCheck}
          />
          <SidebarItem 
            id="OPS" 
            label="ОПС" 
            active={activeTab === 'OPS'} 
            onClick={() => { setActiveTab('OPS'); setShowDetails(null); }}
            icon={Users}
          />
          <SidebarItem 
            id="PDS" 
            label="ПДС" 
            active={activeTab === 'PDS'} 
            onClick={() => { setActiveTab('PDS'); setShowDetails(null); }}
            icon={ArrowRightLeft}
          />
          <SidebarItem 
            id="DISCOUNT_RATES" 
            label="Ставки" 
            active={activeTab === 'DISCOUNT_RATES'} 
            onClick={() => { setActiveTab('DISCOUNT_RATES'); setShowDetails(null); }}
            icon={BarChart3}
          />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-8 mb-4 px-2">Система</p>
          <SidebarItem 
            id="LDM" 
            label="Логическая модель" 
            active={activeTab === 'LDM'} 
            onClick={() => { setActiveTab('LDM'); setShowDetails(null); }}
            icon={Database}
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Calendar size={14} />
              <span className="text-xs font-medium">Отчетная дата</span>
            </div>
            <p className="text-sm font-bold">{GENERAL_PARAMS.reportingDate}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {showDetails && (
                <button 
                  onClick={() => setShowDetails(null)}
                  className="p-1 -ml-2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <h2 className="text-3xl font-bold text-slate-900">
                {showDetails ? showDetails : GENERAL_PARAMS.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <FileText size={16} />
              <span className="text-sm">
                {showDetails ? 'Детализация параметров расчета' : 'Демонстрация актуарных предположений'}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Settings size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Info size={20} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!showDetails ? (
            activeTab === 'LDM' ? (
              <LDMView key="ldm" />
            ) : (
              <motion.div
                key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xl font-bold text-slate-800">{ASSUMPTIONS[activeTab].title}</h3>
                  <p className="text-sm text-slate-500 mt-1">Таблицы и параметры актуарных предположений</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/30">
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Параметр расчета</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Значение / Ссылка</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Описание</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ASSUMPTIONS[activeTab].items.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-blue-50/30 transition-colors">
                          <td className="px-8 py-5 border-b border-slate-100">
                            <span className="font-semibold text-slate-700">{item.label}</span>
                          </td>
                          <td className="px-8 py-5 border-b border-slate-100">
                            <button 
                              onClick={() => handleItemClick(item)}
                              className={`inline-flex items-center gap-2 font-medium transition-all ${
                                item.hasDetails 
                                  ? 'text-blue-600 hover:underline cursor-pointer' 
                                  : 'text-slate-400 cursor-default'
                              }`}
                            >
                              <BarChart3 size={16} />
                              {item.value}
                            </button>
                          </td>
                          <td className="px-8 py-5 border-b border-slate-100">
                            <span className="text-sm text-slate-500 leading-relaxed">{item.description}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )
        ) : showDetails === 'Параметры расчета НПО' ? (
            <motion.div
              key="details-calc"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Параметры расчета НПО</h3>
                    <p className="text-sm text-slate-500 mt-1">Полный список технических параметров и способов их заполнения</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl">
                    <div className="flex items-center gap-2 px-2 text-slate-400">
                      <Filter size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Опционально:</span>
                    </div>
                    <FilterToggle 
                      label="СОЦ РОС" 
                      active={filters.socRos} 
                      onClick={() => setFilters(f => ({ ...f, socRos: !f.socRos }))} 
                    />
                    <FilterToggle 
                      label="ННПФ" 
                      active={filters.nnpf} 
                      onClick={() => setFilters(f => ({ ...f, nnpf: !f.nnpf }))} 
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/30">
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-1/4">Параметр</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-1/6">Код (ID)</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-1/4">Способ заполнения</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-1/6">Значение</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Тип</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNpoParams.map((param, idx) => {
                        const data = getCalcParamData(param.id, param.method);
                        return (
                          <tr key={idx} className="group hover:bg-blue-50/30 transition-colors">
                            <td className="px-8 py-4 border-b border-slate-100">
                              <span className="font-semibold text-slate-700">{param.label}</span>
                            </td>
                            <td className="px-8 py-4 border-b border-slate-100">
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">{param.id}</code>
                            </td>
                             <td className="px-8 py-4 border-b border-slate-100">
                              {(param.id.endsWith('Mon') || param.id.endsWith('Cd') || ['Termination', 'DeathTableType', 'InterpolationType', 'EV_flag', 'Contrib_flag'].includes(param.id)) ? (
                                <div className="flex items-center gap-2 text-slate-400 bg-slate-50/50 px-2 py-1 rounded border border-slate-100 w-fit">
                                  <Database size={12} className="text-blue-500/50" />
                                  <span className="text-xs font-bold uppercase tracking-wider">
                                    {param.id.endsWith('Mon') ? 'Справочник месяцев' : 
                                     param.id.endsWith('Cd') ? 'Выбор типа' : 'Системный выбор'}
                                  </span>
                                </div>
                              ) : (
                                <select 
                                  value={data.method}
                                  onChange={(e) => updateCalcParamData(param.id, 'method', e.target.value)}
                                  className="text-sm text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors w-full"
                                >
                                  {!FILL_METHODS.includes(param.method) && (
                                    <option value={param.method}>{param.method}</option>
                                  )}
                                  {FILL_METHODS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-8 py-4 border-b border-slate-100">
                              {param.id.endsWith('Mon') ? (
                                <select 
                                  value={data.value}
                                  onChange={(e) => updateCalcParamData(param.id, 'value', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                  <option value="">Выберите месяц...</option>
                                  {MONTHS_LIST.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                              ) : param.id.endsWith('Cd') ? (
                                <select 
                                  value={data.value}
                                  onChange={(e) => updateCalcParamData(param.id, 'value', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                  <option value="">Выберите...</option>
                                  <option value="Ежемесячно">Ежемесячно</option>
                                  <option value="Ежегодно">Ежегодно</option>
                                </select>
                              ) : (param.id === 'EV_flag' || param.id === 'Contrib_flag') ? (
                                <select 
                                  value={data.value}
                                  onChange={(e) => updateCalcParamData(param.id, 'value', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                  <option value="">Выберите...</option>
                                  <option value="Y">Y (Да)</option>
                                  <option value="N">N (Нет)</option>
                                </select>
                              ) : (
                                <input 
                                  type="text"
                                  value={data.value}
                                  placeholder="..."
                                  onChange={(e) => updateCalcParamData(param.id, 'value', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                              )}
                            </td>
                            <td className="px-8 py-4 border-b border-slate-100">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                                param.type === 'General' ? 'bg-slate-100 text-slate-400' :
                                param.type === 'СОЦ РОС' ? 'bg-orange-100 text-orange-600' :
                                'bg-purple-100 text-purple-600'
                              }`}>
                                {param.type}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : showDetails === 'Пониж коэф смертности' ? (
            <motion.div
              key="details-mortality"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-12 gap-8">
                {/* Parameterization Panel */}
                <div className="col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6 text-blue-600">
                      <Settings size={18} />
                      <h4 className="font-bold uppercase text-xs tracking-widest">Параметризация таблицы</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Введите первый год</label>
                        <input 
                          type="number" 
                          value={mortalityParams.startAge}
                          onChange={(e) => setMortalityParams(p => ({ ...p, startAge: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Введите шаг</label>
                        <input 
                          type="number" 
                          value={mortalityParams.step}
                          onChange={(e) => setMortalityParams(p => ({ ...p, step: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Введите кол-во лет</label>
                        <input 
                          type="number" 
                          value={mortalityParams.count}
                          onChange={(e) => setMortalityParams(p => ({ ...p, count: Math.min(200, parseInt(e.target.value) || 0) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <p className="text-[10px] text-slate-400 mt-2 ml-1 italic">* Максимум 200 строк для демонстрации</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Инфо</span>
                    </div>
                    <p className="text-sm leading-relaxed opacity-90">
                      Логика автопродления позволяет быстро сформировать возрастной ряд. Тарифы генерируются автоматически на основе базовых актуарных моделей.
                    </p>
                  </div>
                </div>

                {/* Table Panel */}
                <div className="col-span-8 space-y-4">
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <button 
                      onClick={() => {
                        const headers = ['Age', 'Male', 'Female'];
                        const csvRows = [headers.join(',')];
                        for (let i = 0; i < mortalityParams.count; i++) {
                          const age = mortalityParams.startAge + (i * mortalityParams.step);
                          const val = getMortalityReduction(age);
                          csvRows.push(`${age},${val.male},${val.female}`);
                        }
                        downloadCSV('mortality_reduction.csv', csvRows.join('\n'));
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      <FileDown size={14} />
                      Экспорт CSV
                    </button>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">
                      <FileUp size={14} />
                      Импорт CSV
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            const rows = content.split('\n');
                            const newOv = { ...mortalityReductionOverrides };
                            for (let i = 1; i < rows.length; i++) {
                              const cols = rows[i].split(',');
                              if (cols.length >= 3) {
                                const age = cols[0].trim();
                                if (age) {
                                  newOv[age] = { male: cols[1].trim(), female: cols[2].trim() };
                                }
                              }
                            }
                            setMortalityReductionOverrides(newOv);
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-8 py-5 border-b border-slate-100 bg-[#92D050]/10 flex items-center gap-3">
                      <div className="w-2 h-8 bg-[#92D050] rounded-full"></div>
                      <h3 className="font-bold text-slate-800">Пониженные коэф смертности</h3>
                    </div>
                    <div className="overflow-y-auto max-h-[600px]">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-[#92D050] text-slate-900">
                            <th className="px-8 py-4 text-sm font-bold border-r border-white/20">Возраст</th>
                            <th className="px-8 py-4 text-sm font-bold border-r border-white/20">Пожизненный тариф для мужчин</th>
                            <th className="px-8 py-4 text-sm font-bold">Пожизненный тариф для женщин</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedMortalityRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                              <td className="px-8 py-3.5 font-bold text-slate-700 border-r border-slate-100 bg-slate-50/30">{row.age}</td>
                              <td className="px-8 py-3.5 text-slate-600 font-mono text-sm border-r border-slate-100 p-0 text-center">
                                <input 
                                  type="text"
                                  value={row.male}
                                  onChange={(e) => setMortalityReductionOverrides(prev => ({ ...prev, [row.age]: { ...(prev[row.age] || { male: row.male, female: row.female }), male: e.target.value } }))}
                                  className="w-full h-full bg-transparent px-8 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                />
                              </td>
                              <td className="px-8 py-3.5 text-slate-600 font-mono text-sm p-0 text-center">
                                <input 
                                  type="text"
                                  value={row.female}
                                  onChange={(e) => setMortalityReductionOverrides(prev => ({ ...prev, [row.age]: { ...(prev[row.age] || { male: row.male, female: row.female }), female: e.target.value } }))}
                                  className="w-full h-full bg-transparent px-8 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : showDetails === 'Ставки НПО' ? (
            <motion.div
              key="details-rates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-12 gap-8">
                {/* Parameterization Panel */}
                <div className="col-span-3 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6 text-blue-600">
                      <Settings size={18} />
                      <h4 className="font-bold uppercase text-xs tracking-widest">Параметризация</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 ml-1">Режим отображения</label>
                        <div className="flex p-1 bg-slate-100 rounded-xl">
                          <button 
                            onClick={() => setRatesParams(p => ({ ...p, viewMode: 'years' }))}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                              ratesParams.viewMode === 'years' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            Года
                          </button>
                          <button 
                            onClick={() => setRatesParams(p => ({ ...p, viewMode: 'months' }))}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                              ratesParams.viewMode === 'months' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            Месяцы
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Первый {ratesParams.viewMode === 'years' ? 'год' : 'период'}</label>
                        <input 
                          type="number" 
                          value={ratesParams.startYear}
                          onChange={(e) => setRatesParams(p => ({ ...p, startYear: parseInt(e.target.value) || 2024 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      {ratesParams.viewMode === 'years' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Шаг (лет)</label>
                          <input 
                            type="number" 
                            value={ratesParams.step}
                            onChange={(e) => setRatesParams(p => ({ ...p, step: parseInt(e.target.value) || 1 }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Кол-во {ratesParams.viewMode === 'years' ? 'лет' : 'месяцев'}</label>
                        <input 
                          type="number" 
                          value={ratesParams.count}
                          onChange={(e) => setRatesParams(p => ({ ...p, count: Math.min(200, parseInt(e.target.value) || 0) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={ratesParams.saveFor100Years}
                          onChange={(e) => setRatesParams(p => ({ ...p, saveFor100Years: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Сохранить на 100 лет вперед</span>
                      </label>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 ml-1">Опциональные колонки</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={ratesOptionalCols.category}
                            onChange={() => setRatesOptionalCols(p => ({ ...p, category: !p.category }))}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Категория классификации</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={ratesOptionalCols.strategy}
                            onChange={() => setRatesOptionalCols(p => ({ ...p, strategy: !p.strategy }))}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Инвестиционная стратегия</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={ratesOptionalCols.portfolio}
                            onChange={() => setRatesOptionalCols(p => ({ ...p, portfolio: !p.portfolio }))}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Портфель</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Panel */}
                <div className="col-span-9">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-8 py-5 border-b border-slate-100 bg-[#92D050]/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-[#92D050] rounded-full"></div>
                        <h3 className="font-bold text-slate-800">Ставки</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const headers = ['Period', 'indexation1', 'adminGrowth', 'indexation2', 'grossYield', 'netYield', 'yieldRate'];
                            const totalCount = ratesParams.saveFor100Years ? 100 : ratesParams.count;
                            const csvRows = [headers.join(',')];
                            
                            const loopCount = totalCount;
                            for (let i = 0; i < loopCount; i++) {
                              let key = "";
                              if (ratesParams.viewMode === 'months') {
                                const totalMonths = (ratesParams.startYear * 12) + i;
                                const year = Math.floor(totalMonths / 12);
                                const month = (totalMonths % 12) + 1;
                                key = `${year}-${month}`;
                              } else {
                                key = (ratesParams.startYear + (i * ratesParams.step)).toString();
                              }
                              
                              const r = [
                                key,
                                getRatesValue(key, 'indexation1', '0.0400'),
                                getRatesValue(key, 'adminGrowth', '0.0500'),
                                getRatesValue(key, 'indexation2', '0.0400'),
                                getRatesValue(key, 'grossYield', '0.0700'),
                                getRatesValue(key, 'netYield', '0.0600'),
                                getRatesValue(key, 'yieldRate', '0.0650')
                              ];
                              csvRows.push(r.join(','));
                            }
                            downloadCSV(`discount_rates_${ratesParams.viewMode}.csv`, csvRows.join('\n'));
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/50 hover:bg-white text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-slate-200"
                        >
                          <FileDown size={14} />
                          Экспорт CSV
                        </button>
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm">
                          <FileUp size={14} />
                          Импорт CSV
                          <input 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const content = event.target?.result as string;
                                const rows = content.split('\n');
                                const newData = { ...ratesData };
                                for (let i = 1; i < rows.length; i++) {
                                  const cols = rows[i].split(',');
                                  if (cols.length >= 7) {
                                    const key = cols[0].trim();
                                    if (key) {
                                      newData[key] = {
                                        indexation1: cols[1].trim(),
                                        adminGrowth: cols[2].trim(),
                                        indexation2: cols[3].trim(),
                                        grossYield: cols[4].trim(),
                                        netYield: cols[5].trim(),
                                        yieldRate: cols[6].trim()
                                      };
                                    }
                                  }
                                }
                                setRatesData(newData);
                              };
                              reader.readAsText(file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                          <thead className="sticky top-0 z-10">
                            <tr className="text-slate-900 text-[11px] font-bold uppercase tracking-tighter">
                              <th className="px-4 py-4 bg-[#92D050] border-r border-white/20 text-center">Период (Год/Мес)</th>
                              <th className="px-4 py-4 bg-[#92D050] border-r border-white/20 text-center">Ставки индексации пенсии</th>
                              <th className="px-4 py-4 bg-[#92D050] border-r border-white/20 text-center">Годовой темп роста адм. расходов</th>
                              <th className="px-4 py-4 bg-[#92D050] border-r border-white/20 text-center">Ставки индексации пенсии</th>
                              <th className="px-4 py-4 bg-[#92D050] border-r border-white/20 text-center">Доходность (брутто)</th>
                              <th className="px-4 py-4 bg-[#92D050] border-r border-white/20 text-center">Доходность (нетто)</th>
                              <th className="px-4 py-4 bg-[#92D050] border-r border-white/20 text-center">Ставка доходности</th>
                              
                              {ratesOptionalCols.category && (
                                <th className="px-4 py-4 bg-[#B4C7E7] border-r border-white/20 text-center">Категория классификации</th>
                              )}
                              {ratesOptionalCols.strategy && (
                                <th className="px-4 py-4 bg-[#B4C7E7] border-r border-white/20 text-center">Инвестиционная стратегия</th>
                              )}
                              {ratesOptionalCols.portfolio && (
                                <th className="px-4 py-4 bg-[#B4C7E7] text-center">Портфель</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const rows = [];
                              const totalCount = ratesParams.saveFor100Years ? 100 : ratesParams.count;
                              
                              if (ratesParams.viewMode === 'months') {
                                // Full monthly view
                                for (let i = 0; i < totalCount; i++) {
                                  const totalMonths = (ratesParams.startYear * 12) + i;
                                  const year = Math.floor(totalMonths / 12);
                                  const month = (totalMonths % 12) + 1;
                                  const label = `${month.toString().padStart(2, '0')}.${year}`;
                                  const key = `${year}-${month}`;
                                  rows.push({ label, key });
                                }
                              } else {
                                // Yearly view
                                for (let i = 0; i < totalCount; i++) {
                                  const year = ratesParams.startYear + (i * ratesParams.step);
                                  rows.push({ label: year.toString(), key: year.toString() });
                                }
                              }
                              
                              return rows.map((row, i) => {
                                const yearKey = row.key;
                                return (
                                  <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-100 text-[13px]">
                                    <td className="px-4 py-3 font-bold text-slate-700 border-r border-slate-100 bg-slate-50/30 text-center">{row.label}</td>
                                    <td className="px-2 py-2 border-r border-slate-100 relative group/cell">
                                      <input 
                                        type="text"
                                        value={getRatesValue(yearKey, 'indexation1', '0.0400')}
                                        onChange={(e) => updateRatesValue(yearKey, 'indexation1', e.target.value)}
                                        className="w-full bg-transparent text-center font-mono text-slate-600 focus:outline-none focus:bg-blue-50 rounded transition-colors pr-6"
                                      />
                                      <button 
                                        onClick={() => fillDown(yearKey, 'indexation1', getRatesValue(yearKey, 'indexation1', '0.0400'))}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-500 transition-all"
                                        title="Заполнить вниз"
                                      >
                                        <ChevronDown size={12} />
                                      </button>
                                    </td>
                                    <td className="px-2 py-2 border-r border-slate-100 relative group/cell">
                                      <input 
                                        type="text"
                                        value={getRatesValue(yearKey, 'adminGrowth', '0.0500')}
                                        onChange={(e) => updateRatesValue(yearKey, 'adminGrowth', e.target.value)}
                                        className="w-full bg-transparent text-center font-mono text-slate-600 focus:outline-none focus:bg-blue-50 rounded transition-colors pr-6"
                                      />
                                      <button 
                                        onClick={() => fillDown(yearKey, 'adminGrowth', getRatesValue(yearKey, 'adminGrowth', '0.0500'))}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-500 transition-all"
                                        title="Заполнить вниз"
                                      >
                                        <ChevronDown size={12} />
                                      </button>
                                    </td>
                                    <td className="px-2 py-2 border-r border-slate-100 relative group/cell">
                                      <input 
                                        type="text"
                                        value={getRatesValue(yearKey, 'indexation2', '0.0400')}
                                        onChange={(e) => updateRatesValue(yearKey, 'indexation2', e.target.value)}
                                        className="w-full bg-transparent text-center font-mono text-slate-600 focus:outline-none focus:bg-blue-50 rounded transition-colors pr-6"
                                      />
                                      <button 
                                        onClick={() => fillDown(yearKey, 'indexation2', getRatesValue(yearKey, 'indexation2', '0.0400'))}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-500 transition-all"
                                        title="Заполнить вниз"
                                      >
                                        <ChevronDown size={12} />
                                      </button>
                                    </td>
                                    <td className="px-2 py-2 border-r border-slate-100 relative group/cell">
                                      <input 
                                        type="text"
                                        value={getRatesValue(yearKey, 'grossYield', '0.0700')}
                                        onChange={(e) => updateRatesValue(yearKey, 'grossYield', e.target.value)}
                                        className="w-full bg-transparent text-center font-mono text-slate-600 focus:outline-none focus:bg-blue-50 rounded transition-colors pr-6"
                                      />
                                      <button 
                                        onClick={() => fillDown(yearKey, 'grossYield', getRatesValue(yearKey, 'grossYield', '0.0700'))}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-500 transition-all"
                                        title="Заполнить вниз"
                                      >
                                        <ChevronDown size={12} />
                                      </button>
                                    </td>
                                    <td className="px-2 py-2 border-r border-slate-100 relative group/cell">
                                      <input 
                                        type="text"
                                        value={getRatesValue(yearKey, 'netYield', '0.0600')}
                                        onChange={(e) => updateRatesValue(yearKey, 'netYield', e.target.value)}
                                        className="w-full bg-transparent text-center font-mono text-slate-600 focus:outline-none focus:bg-blue-50 rounded transition-colors pr-6"
                                      />
                                      <button 
                                        onClick={() => fillDown(yearKey, 'netYield', getRatesValue(yearKey, 'netYield', '0.0600'))}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-500 transition-all"
                                        title="Заполнить вниз"
                                      >
                                        <ChevronDown size={12} />
                                      </button>
                                    </td>
                                    <td className="px-2 py-2 border-r border-slate-100 relative group/cell">
                                      <input 
                                        type="text"
                                        value={getRatesValue(yearKey, 'yieldRate', '0.0650')}
                                        onChange={(e) => updateRatesValue(yearKey, 'yieldRate', e.target.value)}
                                        className="w-full bg-transparent text-center font-mono text-slate-600 focus:outline-none focus:bg-blue-50 rounded transition-colors pr-6"
                                      />
                                      <button 
                                        onClick={() => fillDown(yearKey, 'yieldRate', getRatesValue(yearKey, 'yieldRate', '0.0650'))}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-500 transition-all"
                                        title="Заполнить вниз"
                                      >
                                        <ChevronDown size={12} />
                                      </button>
                                    </td>
                                    
                                    {ratesOptionalCols.category && (
                                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100 text-center bg-blue-50/20 italic">Стандарт</td>
                                    )}
                                    {ratesOptionalCols.strategy && (
                                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100 text-center bg-blue-50/20 italic">Сбалансированная</td>
                                    )}
                                    {ratesOptionalCols.portfolio && (
                                      <td className="px-4 py-3 text-slate-600 text-center bg-blue-50/20 italic">Основной</td>
                                    )}
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : showDetails === 'Процент расходов НПО' ? (
            <motion.div
              key="details-expense"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-12 gap-8">
                {/* Parameterization Panel */}
                <div className="col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6 text-blue-600">
                      <Settings size={18} />
                      <h4 className="font-bold uppercase text-xs tracking-widest">Параметризация таблицы</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Первый год</label>
                        <input 
                          type="number" 
                          value={expenseParams.startYear}
                          onChange={(e) => setExpenseParams(p => ({ ...p, startYear: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Шаг</label>
                        <input 
                          type="number" 
                          value={expenseParams.step}
                          onChange={(e) => setExpenseParams(p => ({ ...p, step: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Кол-во лет</label>
                        <input 
                          type="number" 
                          value={expenseParams.count}
                          onChange={(e) => setExpenseParams(p => ({ ...p, count: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Опциональные атрибуты</h5>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={expenseOptionalCols.portfolio}
                            onChange={(e) => setExpenseOptionalCols(p => ({ ...p, portfolio: e.target.checked }))}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                          <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Портфель</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Area */}
                <div className="col-span-8 space-y-4">
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <button 
                      onClick={() => {
                        const headers = ['Year', 'UK_Const', 'UK_Var', 'ASV', 'SD', 'VF_Const', 'VF_Var'];
                        const csvRows = [headers.join(',')];
                        
                        for (let i = 0; i < expenseParams.count; i++) {
                          const year = expenseParams.startYear + (i * expenseParams.step);
                          const ov = expenseOverrides[year.toString()] || {};
                          csvRows.push([
                            year,
                            ov.uk_const || '0.15%',
                            ov.uk_var || '10.0%',
                            ov.asv || '0.05%',
                            ov.sd || '0.10%',
                            ov.vf_const || '0.20%',
                            ov.vf_var || '5.0%'
                          ].join(','));
                        }
                        downloadCSV('npo_expenses.csv', csvRows.join('\n'));
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      <FileDown size={14} />
                      Экспорт CSV
                    </button>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">
                      <FileUp size={14} />
                      Импорт CSV
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            const rows = content.split('\n');
                            const newOv = { ...expenseOverrides };
                            for (let i = 1; i < rows.length; i++) {
                              const cols = rows[i].split(',');
                              if (cols.length >= 7) {
                                const year = cols[0].trim();
                                if (year) {
                                  newOv[year] = {
                                    uk_const: cols[1].trim(),
                                    uk_var: cols[2].trim(),
                                    asv: cols[3].trim(),
                                    sd: cols[4].trim(),
                                    vf_const: cols[5].trim(),
                                    vf_var: cols[6].trim()
                                  };
                                }
                              }
                            }
                            setExpenseOverrides(newOv);
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-yellow-300 border-r border-slate-200">Год</th>
                            {expenseOptionalCols.portfolio && (
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-yellow-300 border-r border-slate-200">Портфель</th>
                            )}
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200">УК постоянное</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200">УК переменное</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200">АСВ</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200">СД</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200">ВФ постоянное</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400">ВФ переменное</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Array.from({ length: expenseParams.count }).map((_, idx) => {
                            const year = expenseParams.startYear + (idx * expenseParams.step);
                            const ov = expenseOverrides[year.toString()] || {};
                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3.5 font-bold text-slate-700 border-r border-slate-100 bg-slate-50/30">{year}</td>
                                {expenseOptionalCols.portfolio && (
                                  <td className="px-6 py-3.5 text-slate-600 font-medium border-r border-slate-100">Основной</td>
                                )}
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm border-r border-slate-100 p-0">
                                  <input 
                                    type="text"
                                    value={ov.uk_const || '0.15%'}
                                    onChange={(e) => setExpenseOverrides(prev => ({ ...prev, [year]: { ...(prev[year] || {}), uk_const: e.target.value } }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm border-r border-slate-100 p-0">
                                  <input 
                                    type="text"
                                    value={ov.uk_var || '10.0%'}
                                    onChange={(e) => setExpenseOverrides(prev => ({ ...prev, [year]: { ...(prev[year] || {}), uk_var: e.target.value } }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm border-r border-slate-100 p-0">
                                  <input 
                                    type="text"
                                    value={ov.asv || '0.05%'}
                                    onChange={(e) => setExpenseOverrides(prev => ({ ...prev, [year]: { ...(prev[year] || {}), asv: e.target.value } }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm border-r border-slate-100 p-0">
                                  <input 
                                    type="text"
                                    value={ov.sd || '0.10%'}
                                    onChange={(e) => setExpenseOverrides(prev => ({ ...prev, [year]: { ...(prev[year] || {}), sd: e.target.value } }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm border-r border-slate-100 p-0">
                                  <input 
                                    type="text"
                                    value={ov.vf_const || '0.20%'}
                                    onChange={(e) => setExpenseOverrides(prev => ({ ...prev, [year]: { ...(prev[year] || {}), vf_const: e.target.value } }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm p-0">
                                  <input 
                                    type="text"
                                    value={ov.vf_var || '5.0%'}
                                    onChange={(e) => setExpenseOverrides(prev => ({ ...prev, [year]: { ...(prev[year] || {}), vf_var: e.target.value } }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : showDetails === 'Вероятность расторжения' ? (
            <motion.div
              key="details-termination"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-12 gap-8">
                {/* Parameterization Panel */}
                <div className="col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6 text-blue-600">
                      <Settings size={18} />
                      <h4 className="font-bold uppercase text-xs tracking-widest">Параметризация таблицы</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Начальный срок (лет)</label>
                        <input 
                          type="number" 
                          value={terminationParams.startTerm}
                          onChange={(e) => setTerminationParams(p => ({ ...p, startTerm: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Шаг</label>
                        <input 
                          type="number" 
                          value={terminationParams.step}
                          onChange={(e) => setTerminationParams(p => ({ ...p, step: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Количество строк</label>
                        <input 
                          type="number" 
                          value={terminationParams.count}
                          onChange={(e) => setTerminationParams(p => ({ ...p, count: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Area */}
                <div className="col-span-8 space-y-4">
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <button 
                      onClick={() => {
                        const headers = ['Term', 'Probability'];
                        const csvRows = [headers.join(',')];
                        
                        for (let i = 0; i < terminationParams.count; i++) {
                          const term = terminationParams.startTerm + (i * terminationParams.step);
                          csvRows.push(`${term},${getTerminationProb(term)}`);
                        }
                        downloadCSV('termination_probability.csv', csvRows.join('\n'));
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      <FileDown size={14} />
                      Экспорт CSV
                    </button>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">
                      <FileUp size={14} />
                      Импорт CSV
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            const rows = content.split('\n');
                            const newOv = { ...terminationOverrides };
                            for (let i = 1; i < rows.length; i++) {
                              const cols = rows[i].split(',');
                              if (cols.length >= 2) {
                                const term = cols[0].trim();
                                if (term) {
                                  newOv[term] = cols[1].trim();
                                }
                              }
                            }
                            setTerminationOverrides(newOv);
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200 text-center">
                              Срок действия договора<br/>в годах
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 text-center">
                              Вероятность расторжения от<br/>срока договора
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Array.from({ length: terminationParams.count }).map((_, idx) => {
                            const term = terminationParams.startTerm + (idx * terminationParams.step);
                            const prob = getTerminationProb(term);
                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3.5 font-bold text-slate-700 border-r border-slate-100 bg-slate-50/30 text-center">{term}</td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm text-center p-0">
                                  <input 
                                    type="text"
                                    value={prob}
                                    onChange={(e) => setTerminationOverrides(prev => ({ ...prev, [term]: e.target.value }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : showDetails === 'Таблица смертности' ? (
            <motion.div
              key="details-mortality-table"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-12 gap-8">
                {/* Parameterization Panel */}
                <div className="col-span-3 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6 text-blue-600">
                      <Settings size={18} />
                      <h4 className="font-bold uppercase text-xs tracking-widest">Параметризация</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 ml-1">Режим отображения</label>
                        <div className="flex p-1 bg-slate-100 rounded-xl">
                          <button 
                            onClick={() => setMortalityTableParams(p => ({ ...p, viewMode: 'years' }))}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                              mortalityTableParams.viewMode === 'years' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            Года
                          </button>
                          <button 
                            onClick={() => setMortalityTableParams(p => ({ ...p, viewMode: 'months' }))}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                              mortalityTableParams.viewMode === 'months' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            Месяцы
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">
                          Первый возраст
                        </label>
                        <input 
                          type="number" 
                          value={mortalityTableParams.startAge}
                          onChange={(e) => setMortalityTableParams(p => ({ ...p, startAge: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      {mortalityTableParams.viewMode === 'years' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Шаг (лет)</label>
                          <input 
                            type="number" 
                            value={mortalityTableParams.step}
                            onChange={(e) => setMortalityTableParams(p => ({ ...p, step: parseInt(e.target.value) || 1 }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">
                          Кол-во {mortalityTableParams.viewMode === 'years' ? 'строк' : 'месяцев'}
                        </label>
                        <input 
                          type="number" 
                          value={mortalityTableParams.count}
                          onChange={(e) => setMortalityTableParams(p => ({ ...p, count: Math.min(500, parseInt(e.target.value) || 1) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Инфо</span>
                    </div>
                    <p className="text-sm leading-relaxed opacity-90 mb-6">
                      Таблица смертности является единой для всех продуктов (ОПС, НПО, ПДС). Данные генерируются на основе выбранных параметров возраста и года.
                    </p>
                    <button 
                      onClick={resetMortalityLx}
                      className="w-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl border border-white/30 transition-all"
                    >
                      Сбросить к расчетным
                    </button>
                  </div>
                </div>

                {/* Table Area */}
                <div className="col-span-9 space-y-4">
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <button 
                      onClick={() => {
                        const headers = ['AgeKey', 'Male', 'Female'];
                        const totalCount = mortalityTableParams.count;
                        const csvRows = [headers.join(',')];
                        
                        if (mortalityTableParams.viewMode === 'months') {
                          for (let i = 0; i < totalCount; i++) {
                            const totalAgeMonths = (mortalityTableParams.startAge * 12) + i;
                            const ageYears = Math.floor(totalAgeMonths / 12);
                            const ageMonths = totalAgeMonths % 12;
                            const key = `${ageYears}-${ageMonths}`;
                            const valMale = getLxValue(ageYears, ageMonths, 'Муж');
                            const valFemale = getLxValue(ageYears, ageMonths, 'Жен');
                            csvRows.push(`${key},${valMale},${valFemale}`);
                          }
                        } else {
                          for (let i = 0; i < totalCount; i++) {
                            const age = mortalityTableParams.startAge + (i * mortalityTableParams.step);
                            const valMale = getLxValue(age, 0, 'Муж');
                            const valFemale = getLxValue(age, 0, 'Жен');
                            csvRows.push(`${age},${valMale},${valFemale}`);
                          }
                        }
                        downloadCSV(`mortality_${mortalityTableParams.viewMode}.csv`, csvRows.join('\n'));
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      <FileDown size={14} />
                      Экспорт CSV
                    </button>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">
                      <FileUp size={14} />
                      Импорт CSV
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            const rows = content.split('\n');
                            const newOverrides = { ...mortalityManualLx };
                            for (let i = 1; i < rows.length; i++) {
                              const cols = rows[i].split(',');
                              if (cols.length >= 3) {
                                const key = cols[0].trim();
                                if (key) {
                                  newOverrides[key] = {
                                    male: cols[1].trim() || undefined,
                                    female: cols[2].trim() || undefined
                                  };
                                }
                              }
                            }
                            setMortalityManualLx(newOverrides);
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200 text-center">Возраст (лет)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200 text-center">Возраст (мес)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200 text-center">lx (Муж)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 text-center">lx (Жен)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const rows = [];
                            const totalCount = mortalityTableParams.count;
                            
                            if (mortalityTableParams.viewMode === 'months') {
                              for (let i = 0; i < totalCount; i++) {
                                const totalAgeMonths = (mortalityTableParams.startAge * 12) + i;
                                const ageYears = Math.floor(totalAgeMonths / 12);
                                const ageMonths = totalAgeMonths % 12;
                                
                                const valMale = getLxValue(ageYears, ageMonths, 'Муж');
                                const valFemale = getLxValue(ageYears, ageMonths, 'Жен');

                                rows.push(
                                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3.5 text-slate-600 font-semibold border-r border-slate-100 text-center">{ageYears}</td>
                                    <td className="px-6 py-3.5 text-slate-600 border-r border-slate-100 text-center">{ageMonths}</td>
                                    <td className="px-6 py-3.5 text-slate-600 font-mono text-sm text-center p-0 border-r border-slate-100">
                                      <input 
                                        type="text"
                                        value={valMale}
                                        onChange={(e) => updateLxValue(ageYears, ageMonths, 'Муж', e.target.value)}
                                        className="w-full h-full bg-transparent px-4 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                      />
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-600 font-mono text-sm text-center p-0">
                                      <input 
                                        type="text"
                                        value={valFemale}
                                        onChange={(e) => updateLxValue(ageYears, ageMonths, 'Жен', e.target.value)}
                                        className="w-full h-full bg-transparent px-4 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                      />
                                    </td>
                                  </tr>
                                );
                              }
                            } else {
                              for (let i = 0; i < totalCount; i++) {
                                const age = mortalityTableParams.startAge + (i * mortalityTableParams.step);
                                
                                const valMale = getLxValue(age, 0, 'Муж');
                                const valFemale = getLxValue(age, 0, 'Жен');

                                rows.push(
                                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3.5 text-slate-600 font-semibold border-r border-slate-100 text-center">{age}</td>
                                    <td className="px-6 py-3.5 text-slate-600 border-r border-slate-100 text-center">0</td>
                                    <td className="px-6 py-3.5 text-slate-600 font-mono text-sm text-center p-0 border-r border-slate-100">
                                      <input 
                                        type="text"
                                        value={valMale}
                                        onChange={(e) => updateLxValue(age, 0, 'Муж', e.target.value)}
                                        className="w-full h-full bg-transparent px-4 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                      />
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-600 font-mono text-sm text-center p-0">
                                      <input 
                                        type="text"
                                        value={valFemale}
                                        onChange={(e) => updateLxValue(age, 0, 'Жен', e.target.value)}
                                        className="w-full h-full bg-transparent px-4 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                      />
                                    </td>
                                  </tr>
                                );
                              }
                            }
                            return rows;
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : showDetails === 'Таблица выхода на пенсию' ? (
            <motion.div
              key="details-retirement-table"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-12 gap-8">
                {/* Parameterization Panel */}
                <div className="col-span-3 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6 text-blue-600">
                      <Settings size={18} />
                      <h4 className="font-bold uppercase text-xs tracking-widest">Параметризация</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Тип заведения</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button 
                            onClick={() => setRetirementParams(p => ({ ...p, type: 'accumulative' }))}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${retirementParams.type === 'accumulative' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            Накопительная
                          </button>
                          <button 
                            onClick={() => setRetirementParams(p => ({ ...p, type: 'non-accumulative' }))}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${retirementParams.type === 'non-accumulative' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            Не накопительная
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Первый возраст (год)</label>
                        <input 
                          type="number" 
                          value={retirementParams.startAge}
                          onChange={(e) => setRetirementParams(p => ({ ...p, startAge: parseInt(e.target.value) || 55 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Шаг (лет)</label>
                        <input 
                          type="number" 
                          value={retirementParams.step}
                          onChange={(e) => setRetirementParams(p => ({ ...p, step: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Количество строк</label>
                        <input 
                          type="number" 
                          value={retirementParams.count}
                          onChange={(e) => setRetirementParams(p => ({ ...p, count: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer group pt-2">
                        <input 
                          type="checkbox" 
                          checked={retirementParams.showOnlyFilled}
                          onChange={(e) => setRetirementParams(p => ({ ...p, showOnlyFilled: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Только заполненные строки</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Инфо</span>
                    </div>
                    <p className="text-sm leading-relaxed opacity-90">
                      Таблица выхода на пенсию является единой для всех продуктов. Она определяет вероятность наступления пенсионных оснований в зависимости от возраста и пола.
                    </p>
                  </div>
                </div>

                {/* Table Area */}
                <div className="col-span-9 space-y-4">
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <button 
                      onClick={() => {
                        const headers = ['Age', 'Probability'];
                        const totalCount = retirementParams.count;
                        const csvRows = [headers.join(',')];
                        const data = retirementParams.type === 'accumulative' ? retirementProbsAccum : retirementProbsNonAccum;
                        
                        for (let i = 0; i < totalCount; i++) {
                          const age = retirementParams.startAge + (i * retirementParams.step);
                          csvRows.push(`${age},${data[age.toString()] || '0.0000'}`);
                        }
                        downloadCSV(`retirement_${retirementParams.type}.csv`, csvRows.join('\n'));
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      <FileDown size={14} />
                      Экспорт CSV
                    </button>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">
                      <FileUp size={14} />
                      Импорт CSV
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            const rows = content.split('\n');
                            const newData = { ...(retirementParams.type === 'accumulative' ? retirementProbsAccum : retirementProbsNonAccum) };
                            for (let i = 1; i < rows.length; i++) {
                              const cols = rows[i].split(',');
                              if (cols.length >= 2) {
                                const age = cols[0].trim();
                                if (age) {
                                  newData[age] = cols[1].trim();
                                }
                              }
                            }
                            if (retirementParams.type === 'accumulative') setRetirementProbsAccum(newData);
                            else setRetirementProbsNonAccum(newData);
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-yellow-400 border-r border-slate-200 text-center">Возраст (год)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-yellow-400 border-r border-slate-200 text-center">Возраст (мес)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-yellow-400 border-r border-slate-200 text-center">Пол</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100 text-center">Вероятность выхода на пенсию</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const allRows = [];
                            for (let idx = 0; idx < retirementParams.count; idx++) {
                              const age = retirementParams.startAge + (idx * retirementParams.step);
                              allRows.push({ age, gender: 'М' });
                              allRows.push({ age, gender: 'Ж' });
                            }

                            const filteredRows = retirementParams.showOnlyFilled 
                              ? allRows.filter(row => getRetirementProb(row.age, row.gender) !== '')
                              : allRows;

                            return filteredRows.map((row, idx) => {
                              const prob = getRetirementProb(row.age, row.gender);
                              
                              return (
                                <tr key={`${row.age}-${row.gender}`} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-3.5 font-bold text-slate-700 border-r border-slate-100 bg-slate-50/30 text-center">{row.age}</td>
                                  <td className="px-6 py-3.5 text-slate-600 border-r border-slate-100 text-center">0</td>
                                  <td className="px-6 py-3.5 text-slate-600 border-r border-slate-100 text-center">{row.gender}</td>
                                  <td className="px-6 py-3.5 text-slate-600 font-mono text-sm text-center p-0">
                                    <input 
                                      type="text"
                                      value={prob}
                                      onChange={(e) => updateRetirementProb(row.age, row.gender, e.target.value)}
                                      placeholder="Введите вероятность (напр. 1.0)"
                                      className="w-full h-full bg-transparent px-6 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                    />
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : showDetails === 'пожизненные тарифы' ? (
            <motion.div
              key="details-life-tariffs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-12 gap-8">
                {/* Parameterization Panel */}
                <div className="col-span-3 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6 text-blue-600">
                      <Settings size={18} />
                      <h4 className="font-bold uppercase text-xs tracking-widest">Параметризация</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Возраст участника</label>
                        <input 
                          type="number" 
                          value={lifeTariffParams.age}
                          onChange={(e) => setLifeTariffParams(p => ({ ...p, age: parseInt(e.target.value) || 60 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Инфо</span>
                    </div>
                    <p className="text-sm leading-relaxed opacity-90">
                      Пожизненные тарифы используются для расчета размера пожизненных негосударственных пенсий. Тариф зависит от выбранной пенсионной схемы, пола и возраста участника.
                    </p>
                  </div>
                </div>

                {/* Table Area */}
                <div className="col-span-9 space-y-4">
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <button 
                      onClick={() => {
                        const headers = ['SchemeCode', 'Age', 'Male', 'Female'];
                        const csvRows = [headers.join(',')];
                        const age = lifeTariffParams.age;
                        schemeCodes.slice(0, lifeTariffParams.count).forEach(code => {
                          const val = getLifeTariffVal(code, age);
                          csvRows.push(`${code},${age},${val.male},${val.female}`);
                        });
                        downloadCSV(`life_tariffs_age_${age}.csv`, csvRows.join('\n'));
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      <FileDown size={14} />
                      Экспорт CSV
                    </button>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">
                      <FileUp size={14} />
                      Импорт CSV
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            const rows = content.split('\n');
                            const newOv = { ...lifeTariffOverrides };
                            for (let i = 1; i < rows.length; i++) {
                              const cols = rows[i].split(',');
                              if (cols.length >= 4) {
                                const code = cols[0].trim();
                                const ageAttr = cols[1].trim();
                                if (code && ageAttr) {
                                  newOv[`${code}-${ageAttr}`] = { male: cols[2].trim(), female: cols[3].trim() };
                                }
                              }
                            }
                            setLifeTariffOverrides(newOv);
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-yellow-400 border-r border-slate-200 text-center">Код схемы</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-yellow-400 border-r border-slate-200 text-center">Пол</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200 text-center">Возраст участника</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200 text-center">Пожизненный тариф для мужчин</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 text-center">Пожизненный тариф для женщин</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {schemeCodes.slice(0, lifeTariffParams.count).map((code, idx) => {
                            const age = lifeTariffParams.age;
                            const val = getLifeTariffVal(code, age);
                            
                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3.5 font-bold text-slate-700 border-r border-slate-100 bg-slate-50/30 text-center">{code}</td>
                                <td className="px-6 py-3.5 text-slate-600 border-r border-slate-100 text-center">-</td>
                                <td className="px-6 py-3.5 text-slate-600 border-r border-slate-100 text-center">{age}</td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm border-r border-slate-100 text-center p-0">
                                  <input 
                                    type="text"
                                    value={val.male}
                                    onChange={(e) => setLifeTariffOverrides(prev => ({ ...prev, [`${code}-${age}`]: { ...(prev[`${code}-${age}`] || val), male: e.target.value } }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm text-center p-0">
                                  <input 
                                    type="text"
                                    value={val.female}
                                    onChange={(e) => setLifeTariffOverrides(prev => ({ ...prev, [`${code}-${age}`]: { ...(prev[`${code}-${age}`] || val), female: e.target.value } }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : showDetails === 'Срочные тарифы' ? (
            <motion.div
              key="details-term-tariffs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-12 gap-8">
                {/* Parameterization Panel */}
                <div className="col-span-3 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6 text-blue-600">
                      <Settings size={18} />
                      <h4 className="font-bold uppercase text-xs tracking-widest">Параметризация</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Возраст участника</label>
                        <input 
                          type="number" 
                          value={termTariffParams.age}
                          onChange={(e) => setTermTariffParams(p => ({ ...p, age: parseInt(e.target.value) || 60 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Срок выплаты (лет)</label>
                        <input 
                          type="number" 
                          value={termTariffParams.term}
                          onChange={(e) => setTermTariffParams(p => ({ ...p, term: parseInt(e.target.value) || 10 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Инфо</span>
                    </div>
                    <p className="text-sm leading-relaxed opacity-90">
                      Срочные тарифы используются для расчета размера негосударственных пенсий, выплачиваемых в течение определенного срока.
                    </p>
                  </div>
                </div>

                {/* Table Area */}
                <div className="col-span-9 space-y-4">
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <button 
                      onClick={() => {
                        const headers = ['SchemeCode', 'Age', 'Term', 'Male', 'Female'];
                        const csvRows = [headers.join(',')];
                        const age = termTariffParams.age;
                        const term = termTariffParams.term;
                        schemeCodes.slice(0, termTariffParams.count).forEach(code => {
                          const val = getTermTariffVal(code, age, term);
                          csvRows.push(`${code},${age},${term},${val.male},${val.female}`);
                        });
                        downloadCSV(`term_tariffs_age_${age}_term_${term}.csv`, csvRows.join('\n'));
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      <FileDown size={14} />
                      Экспорт CSV
                    </button>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">
                      <FileUp size={14} />
                      Импорт CSV
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            const rows = content.split('\n');
                            const newOv = { ...termTariffOverrides };
                            for (let i = 1; i < rows.length; i++) {
                              const cols = rows[i].split(',');
                              if (cols.length >= 5) {
                                const code = cols[0].trim();
                                const ageAttr = cols[1].trim();
                                const termAttr = cols[2].trim();
                                if (code && ageAttr && termAttr) {
                                  newOv[`${code}-${ageAttr}-${termAttr}`] = { male: cols[3].trim(), female: cols[4].trim() };
                                }
                              }
                            }
                            setTermTariffOverrides(newOv);
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-yellow-400 border-r border-slate-200 text-center">Код схемы</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-yellow-400 border-r border-slate-200 text-center">Пол</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200 text-center">Возраст участника</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200 text-center">Срок выплаты пенсии</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 border-r border-slate-200 text-center">Тариф для мужчин</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-lime-400 text-center">Тариф для женщин</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {schemeCodes.slice(0, termTariffParams.count).map((code, idx) => {
                            const age = termTariffParams.age;
                            const term = termTariffParams.term;
                            const val = getTermTariffVal(code, age, term);
                            
                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3.5 font-bold text-slate-700 border-r border-slate-100 bg-slate-50/30 text-center">{code}</td>
                                <td className="px-6 py-3.5 text-slate-600 border-r border-slate-100 text-center">-</td>
                                <td className="px-6 py-3.5 text-slate-600 border-r border-slate-100 text-center">{age}</td>
                                <td className="px-6 py-3.5 text-slate-600 border-r border-slate-100 text-center">{term}</td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm border-r border-slate-100 text-center p-0">
                                  <input 
                                    type="text"
                                    value={val.male}
                                    onChange={(e) => setTermTariffOverrides(prev => ({ ...prev, [`${code}-${age}-${term}`]: { ...(prev[`${code}-${age}-${term}`] || val), male: e.target.value } }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                                <td className="px-6 py-3.5 text-slate-600 font-mono text-sm text-center p-0">
                                  <input 
                                    type="text"
                                    value={val.female}
                                    onChange={(e) => setTermTariffOverrides(prev => ({ ...prev, [`${code}-${age}-${term}`]: { ...(prev[`${code}-${age}-${term}`] || val), female: e.target.value } }))}
                                    className="w-full h-full bg-transparent px-6 py-3.5 text-center focus:outline-none focus:bg-blue-50 transition-colors"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div />
          )}
        </AnimatePresence>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Статус валидации</p>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-bold text-slate-700">Проверено</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Последнее обновление</p>
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">Сегодня, 09:21</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Версия модели</p>
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">v2.4.1-stable</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
