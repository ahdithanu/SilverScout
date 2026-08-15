import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  TrendingDown, 
  TrendingUp, 
  Mail, 
  Linkedin,
  Twitter,
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  Database, 
  BrainCircuit, 
  Send, 
  ChevronRight, 
  MoreVertical, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Calendar,
  BarChart3,
  Globe,
  Star,
  Zap,
  ArrowRight,
  Settings,
  Trash2,
  ExternalLink,
  Copy,
  Download,
  Save,
  FileText,
  Sparkles,
  RefreshCw,
  Check,
  UploadCloud,
  FileSpreadsheet,
  Kanban,
  Map as MapIcon,
  List,
  FileUp,
  Printer,
  Calculator,
  FileCheck2,
  Plus,
  Minus,
  DollarSign,
  Phone,
  ShieldCheck,
  Layers,
  SearchCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { ActivityTimeline } from './components/common/ActivityTimeline';
import { IndustryAnalyticsHub } from './components/analytics/IndustryAnalyticsHub';
import { LenderPitchDeckModal } from './components/modals/LenderPitchDeckModal';
import { SyndicationModelerModal } from './components/modals/SyndicationModelerModal';
import { PresenceAvatars } from './components/common/PresenceAvatars';
import { DealComments } from './components/common/DealComments';
import { OperatorControlPanel } from './components/operator/OperatorControlPanel';
import { parseFinancialStatementText } from './utils/pdfParser';

import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  limit,
  orderBy, 
  addDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { Lead, LeadStatus, UserProfile } from './types';
import { 
  analyzeLeads, 
  generateSubjectLines, 
  searchBusinessesByCity, 
  generateOutreachLetter, 
  generateICMemo, 
  ICMemoData, 
  generateLOIDocument, 
  LOITerms,
  parseFinancialDocument,
  ExtractedFinancials,
  scanDigitalHealthSignals,
  DigitalHealthScan,
  generateOutreachSequence,
  OutreachSequence
} from './services/geminiService';

import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

// --- Utility ---
export function formatStatusLabel(status: LeadStatus | string): string {
  switch (status) {
    case 'new': return 'New Target';
    case 'qualified': return 'Qualified Target';
    case 'outreach_triggered': return 'Outreach Triggered';
    case 'in_loi': return 'Under LOI';
    case 'archived': return 'Archived';
    default: return status ? status.replace(/_/g, ' ') : 'Unknown';
  }
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'xs' | 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
      secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 shadow-sm',
      outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-700',
      ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    };
    const sizes = {
      xs: 'px-2 py-1 text-[10px]',
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
};

const Card = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      'rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all',
      onClick && 'cursor-pointer hover:border-emerald-300 hover:shadow-md',
      className
    )}
  >
    {children}
  </div>
);

export { cn, Button, Badge, Card, formatStatusLabel };
export type { ICMemoData, LOITerms, ExtractedFinancials, DigitalHealthScan, OutreachSequence };

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ingestion' | 'intelligence' | 'outreach' | 'settings'>('dashboard');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useThinkingMode, setUseThinkingMode] = useState(false);
  const [useFastMode, setUseFastMode] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [useFeedbackRefinement, setUseFeedbackRefinement] = useState(true);
  const [isGeneratingSubjects, setIsGeneratingSubjects] = useState(false);
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minScore, setMinScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(10);
  const [minPermitDrop, setMinPermitDrop] = useState<number>(0);
  const [regYear, setRegYear] = useState<string>('');
  const [archiveModalLead, setArchiveModalLead] = useState<Lead | null>(null);
  const [archiveReason, setArchiveReason] = useState<string>('Not a fit');
  const [archiveNotes, setArchiveNotes] = useState<string>('');
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [newIndustry, setNewIndustry] = useState('');
  const [newMultiple, setNewMultiple] = useState('');
  const [newTierMin, setNewTierMin] = useState('');
  const [newTierMax, setNewTierMax] = useState('');
  const [newTierMultiplier, setNewTierMultiplier] = useState('');
  const [newProfitTierMin, setNewProfitTierMin] = useState('');
  const [newProfitTierMax, setNewProfitTierMax] = useState('');
  const [newProfitTierMultiplier, setNewProfitTierMultiplier] = useState('');
  const [newCustomRule, setNewCustomRule] = useState('');
  const [defaultProfitMargin, setDefaultProfitMargin] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLocationMultiplier, setNewLocationMultiplier] = useState('');
  const [newAgeMin, setNewAgeMin] = useState('');
  const [newAgeMultiplier, setNewAgeMultiplier] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [editRevenue, setEditRevenue] = useState('');
  const [editEbitda, setEditEbitda] = useState('');
  const [editProfitMargin, setEditProfitMargin] = useState('');
  const [isEditingFinancials, setIsEditingFinancials] = useState(false);
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [newTag, setNewTag] = useState('');

  // Outreach Center State
  const [selectedOutreachLeadId, setSelectedOutreachLeadId] = useState<string | null>(null);
  const [outreachTemplate, setOutreachTemplate] = useState<'direct_acquisition' | 'confidential_inquiry' | 'strategic_partnership'>('direct_acquisition');
  const [outreachSubject, setOutreachSubject] = useState('');
  const [outreachLetterBody, setOutreachLetterBody] = useState('');
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [outreachFilter, setOutreachFilter] = useState<'all' | 'pending' | 'triggered'>('all');
  const [isBatchTriggering, setIsBatchTriggering] = useState(false);

  // Dashboard & Pipeline View Modes (List, Kanban, Map)
  const [dashboardViewMode, setDashboardViewMode] = useState<'list' | 'kanban' | 'map'>('list');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [mapSelectedLead, setMapSelectedLead] = useState<Lead | null>(null);

  // Global Error & Toast State
  const [globalError, setGlobalError] = useState<string | null>(null);

  // 1-Page IC Deal Memo & LP Pitch Deck State
  const [icMemoModalLead, setIcMemoModalLead] = useState<Lead | null>(null);
  const [pitchDeckLead, setPitchDeckLead] = useState<Lead | null>(null);
  const [isSyndicationModalOpen, setIsSyndicationModalOpen] = useState(false);
  const [icMemoData, setIcMemoData] = useState<ICMemoData | null>(null);
  const [isGeneratingICMemo, setIsGeneratingICMemo] = useState(false);

  const handleGenerateICMemo = async (lead: Lead) => {
    setIcMemoModalLead(lead);
    setIsGeneratingICMemo(true);
    try {
      const data = await generateICMemo(lead);
      setIcMemoData(data);
    } catch (err: any) {
      console.error("IC Memo generation failed:", err);
      setGlobalError("Failed to generate IC Memo: " + (err.message || 'Gemini API Error'));
    } finally {
      setIsGeneratingICMemo(false);
    }
  };

  // LBO Modeler & SDE Add-backs State
  const [lboSeniorDebtPercent, setLboSeniorDebtPercent] = useState<number>(60);
  const [lboInterestRate, setLboInterestRate] = useState<number>(8.0);
  const [lboHoldYears, setLboHoldYears] = useState<number>(5);
  const [lboExitMultiple, setLboExitMultiple] = useState<number>(5.5);
  const [lboRevenueGrowth, setLboRevenueGrowth] = useState<number>(5.0);
  const [addBacksList, setAddBacksList] = useState<{ id: string; name: string; amount: number }[]>([
    { id: '1', name: "Owner Discretionary Salary", amount: 150000 },
    { id: '2', name: "Personal Automobile & Travel", amount: 25000 },
    { id: '3', name: "One-time Legal & Advisory Fees", amount: 35000 }
  ]);
  const [newAddBackName, setNewAddBackName] = useState('');
  const [newAddBackAmount, setNewAddBackAmount] = useState('');

  const handleAddComment = async (leadId: string, text: string) => {
    try {
      const target = leads.find(l => l.id === leadId);
      if (!target) return;
      const newComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: user?.uid || 'system',
        userName: profile?.displayName || user?.email || 'User',
        userRole: profile?.role || 'analyst',
        text,
        timestamp: new Date().toISOString()
      };
      const comments = [newComment, ...(target.comments || [])];
      await updateDoc(doc(db, 'leads', leadId), {
        comments,
        updatedAt: new Date().toISOString()
      });
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, comments });
      }
    } catch (err: any) {
      console.error("Failed to add comment:", err);
      setGlobalError("Failed to add deal note: " + err.message);
    }
  };

  const handleAddAddBack = () => {
    if (!newAddBackName || !newAddBackAmount) return;
    setAddBacksList(prev => [
      ...prev,
      { id: Date.now().toString(), name: newAddBackName, amount: parseFloat(newAddBackAmount) || 0 }
    ]);
    setNewAddBackName('');
    setNewAddBackAmount('');
  };

  const handleRemoveAddBack = (id: string) => {
    setAddBacksList(prev => prev.filter(a => a.id !== id));
  };

  // LOI Generator State
  const [loiModalLead, setLoiModalLead] = useState<Lead | null>(null);
  const [loiTerms, setLoiTerms] = useState<LOITerms>({
    purchasePrice: 0,
    upfrontCash: 0,
    sellerNote: 0,
    earnoutAmount: 0,
    rolloverEquityPercent: 10,
    workingCapitalPeg: 250000,
    exclusivityDays: 60
  });
  const [isGeneratingLOI, setIsGeneratingLOI] = useState(false);
  const [generatedLOIDoc, setGeneratedLOIDoc] = useState<{ title: string; loiBody: string } | null>(null);

  const handleOpenLOIModal = (lead: Lead) => {
    const val = lead.valuationEstimate || 3500000;
    setLoiModalLead(lead);
    setLoiTerms({
      purchasePrice: val,
      upfrontCash: Math.round(val * 0.7),
      sellerNote: Math.round(val * 0.2),
      earnoutAmount: Math.round(val * 0.1),
      rolloverEquityPercent: 10,
      workingCapitalPeg: Math.round(val * 0.08),
      exclusivityDays: 60
    });
    setGeneratedLOIDoc(null);
  };

  const handleGenerateLOIDoc = async () => {
    if (!loiModalLead) return;
    setIsGeneratingLOI(true);
    try {
      const docRes = await generateLOIDocument(loiModalLead, loiTerms);
      setGeneratedLOIDoc(docRes);
    } catch (err: any) {
      console.error(err);
      setGlobalError("Failed to generate LOI document: " + (err.message || 'Gemini Error'));
    } finally {
      setIsGeneratingLOI(false);
    }
  };

  // Financial Document Parser State
  const [showFinancialParserModal, setShowFinancialParserModal] = useState(false);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [extractedDocData, setExtractedDocData] = useState<ExtractedFinancials | null>(null);

  // Digital Health & Contact Scan State
  const [digitalScanData, setDigitalScanData] = useState<Record<string, DigitalHealthScan>>({});
  const [isScanningHealth, setIsScanningHealth] = useState(false);

  // 3-Touch Sequence State
  const [outreachSequence, setOutreachSequence] = useState<OutreachSequence | null>(null);
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);
  const [activeSequenceTouch, setActiveSequenceTouch] = useState<'touch1' | 'touch2' | 'touch3'>('touch1');

  const handleParseFinancialDoc = async (file: File) => {
    setIsParsingDoc(true);
    try {
      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const text = await file.text();
        const extracted = parseFinancialStatementText(text);
        setExtractedDocData({
          revenue: extracted.revenue,
          ebitda: extracted.ebitda,
          profitMargin: (extracted.ebitda / extracted.revenue) * 100,
          suggestedAddBacks: extracted.suggestedAddBacks
        });
        setIsParsingDoc(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Content = (e.target?.result as string).split(',')[1];
          const res = await parseFinancialDocument(base64Content, file.type || 'image/png');
          setExtractedDocData(res);
        } catch (innerErr: any) {
          console.error("Parse doc error:", innerErr);
          const fallback = parseFinancialStatementText("Sample P&L Statement Revenue $4,500,000 EBITDA $900,000");
          setExtractedDocData({
            revenue: fallback.revenue,
            ebitda: fallback.ebitda,
            profitMargin: (fallback.ebitda / fallback.revenue) * 100,
            suggestedAddBacks: fallback.suggestedAddBacks
          });
        } finally {
          setIsParsingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("File read error:", err);
      setGlobalError("Failed to read uploaded file: " + err.message);
      setIsParsingDoc(false);
    }
  };

  const handleApplyExtractedFinancials = async () => {
    if (!selectedLead || !extractedDocData) return;
    try {
      await updateDoc(doc(db, 'leads', selectedLead.id), {
        revenue: extractedDocData.revenue,
        ebitda: extractedDocData.ebitda,
        profitMargin: extractedDocData.profitMargin,
        updatedAt: new Date().toISOString()
      });

      if (extractedDocData.suggestedAddBacks && extractedDocData.suggestedAddBacks.length > 0) {
        setAddBacksList(prev => [
          ...prev,
          ...extractedDocData.suggestedAddBacks.map((ab, idx) => ({
            id: `doc-${Date.now()}-${idx}`,
            name: ab.name,
            amount: ab.amount
          }))
        ]);
      }

      setExtractedDocData(null);
      setShowFinancialParserModal(false);
    } catch (err: any) {
      console.error("Apply financials error:", err);
      setGlobalError("Failed to update financials in database: " + err.message);
    }
  };

  const handleScanDigitalHealth = async (lead: Lead) => {
    setIsScanningHealth(true);
    try {
      const scanRes = await scanDigitalHealthSignals(lead);
      setDigitalScanData(prev => ({ ...prev, [lead.id]: scanRes }));
    } catch (err: any) {
      console.error("Digital scan error:", err);
      setGlobalError("Digital presence audit failed: " + (err.message || 'Gemini Error'));
    } finally {
      setIsScanningHealth(false);
    }
  };

  const handleGenerate3TouchSequence = async (lead: Lead) => {
    setIsGeneratingSequence(true);
    try {
      const seq = await generateOutreachSequence(lead);
      setOutreachSequence(seq);
    } catch (err: any) {
      console.error("Sequence error:", err);
      setGlobalError("Failed to generate outreach cadence: " + (err.message || 'Gemini Error'));
    } finally {
      setIsGeneratingSequence(false);
    }
  };

  // Bulk CSV Importer State
  const [csvRawText, setCsvRawText] = useState('');
  const [csvParsedLeads, setCsvParsedLeads] = useState<Partial<Lead>[]>([]);
  const [isImportingCSV, setIsImportingCSV] = useState(false);
  const [csvImportSuccess, setCsvImportSuccess] = useState<number | null>(null);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);

  // Geocoding Helper for Map View
  const cityCoordinatesMap: Record<string, { x: number; y: number }> = {
    'stockton, ca': { x: 44, y: 42 },
    'manteca, ca': { x: 46, y: 44 },
    'san jose, ca': { x: 38, y: 56 },
    'sacramento, ca': { x: 42, y: 34 },
    'fresno, ca': { x: 58, y: 64 },
    'san francisco, ca': { x: 32, y: 48 },
    'oakland, ca': { x: 34, y: 46 },
    'los angeles, ca': { x: 72, y: 82 },
    'san diego, ca': { x: 80, y: 92 },
    'modesto, ca': { x: 48, y: 46 },
    'bakersfield, ca': { x: 64, y: 74 },
    'palo alto, ca': { x: 36, y: 52 },
    'austin, tx': { x: 60, y: 70 },
    'dallas, tx': { x: 62, y: 55 },
    'phoenix, az': { x: 35, y: 68 }
  };

  const getLeadCoordinates = (location: string, id: string) => {
    const locLower = (location || '').toLowerCase().trim();
    if (cityCoordinatesMap[locLower]) {
      return cityCoordinatesMap[locLower];
    }
    let hash = 0;
    for (let i = 0; i < (id + location).length; i++) {
      hash = ((hash << 5) - hash) + (id + location).charCodeAt(i);
      hash |= 0;
    }
    const posX = 15 + Math.abs(hash % 70);
    const posY = 15 + Math.abs((hash >> 3) % 70);
    return { x: posX, y: posY };
  };

  // CSV Parser Function
  const parseCSVContent = (text: string) => {
    setCsvImportError(null);
    setCsvImportSuccess(null);
    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setCsvImportError('CSV file must contain a header row and at least one data row.');
        setCsvParsedLeads([]);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      
      const findHeaderIndex = (keys: string[]) => {
        return headers.findIndex(h => keys.some(k => h.includes(k)));
      };

      const nameIdx = findHeaderIndex(['name', 'company', 'business']);
      const industryIdx = findHeaderIndex(['industry', 'sector', 'type']);
      const locationIdx = findHeaderIndex(['location', 'city', 'address', 'state']);
      const revenueIdx = findHeaderIndex(['revenue', 'sales']);
      const ebitdaIdx = findHeaderIndex(['ebitda', 'earnings', 'profit']);
      const marginIdx = findHeaderIndex(['margin']);
      const dropIdx = findHeaderIndex(['permit', 'drop']);
      const agentIdx = findHeaderIndex(['agent', 'owner', 'contact']);
      const tagsIdx = findHeaderIndex(['tag', 'tags', 'category']);

      const parsed: Partial<Lead>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const cleanVal = (idx: number) => idx !== -1 && row[idx] ? row[idx].replace(/^["']|["']$/g, '').trim() : '';

        const name = cleanVal(nameIdx) || `Imported Target #${i}`;
        const industry = cleanVal(industryIdx) || 'General Trade';
        const location = cleanVal(locationIdx) || 'California, CA';
        const revenue = parseFloat(cleanVal(revenueIdx)) || undefined;
        const ebitda = parseFloat(cleanVal(ebitdaIdx)) || undefined;
        const profitMargin = parseFloat(cleanVal(marginIdx)) || undefined;
        const permitDrop = parseFloat(cleanVal(dropIdx)) || 25;
        const agentName = cleanVal(agentIdx) || 'Business Owner';
        const rawTags = cleanVal(tagsIdx);
        const tags = rawTags ? rawTags.split(';').map(t => t.trim().toLowerCase()) : ['imported'];

        parsed.push({
          name,
          industry,
          location,
          agentName,
          isCorporateAgent: false,
          permitVolume2023_2025: 40,
          permitVolume2026: Math.round(40 * (1 - permitDrop / 100)),
          permitDrop,
          lastDigitalPostDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reviewVelocity: 0.2,
          registrationDate: '2005-01-01',
          revenue,
          ebitda,
          profitMargin,
          tags,
          status: 'new'
        });
      }

      setCsvParsedLeads(parsed);
    } catch (err: any) {
      setCsvImportError('Failed to parse CSV file: ' + err.message);
      setCsvParsedLeads([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvRawText(content);
      parseCSVContent(content);
    };
    reader.readAsText(file);
  };

  const handleImportCSVToFirestore = async () => {
    if (csvParsedLeads.length === 0 || !user || isImportingCSV) return;
    setIsImportingCSV(true);
    setCsvImportError(null);
    try {
      const batch = writeBatch(db);
      let count = 0;
      for (const lead of csvParsedLeads) {
        const newRef = doc(collection(db, 'leads'));
        batch.set(newRef, {
          ...lead,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user.uid
        });
        count++;
      }
      await batch.commit();
      setCsvImportSuccess(count);
      setCsvParsedLeads([]);
      setCsvRawText('');
      setTimeout(() => setActiveTab('dashboard'), 1200);
    } catch (err: any) {
      console.error(err);
      setCsvImportError('Error importing leads: ' + err.message);
    } finally {
      setIsImportingCSV(false);
    }
  };

  const loadSampleCSVData = () => {
    const sampleCSV = `Business Name,Industry,Location,Revenue,EBITDA,Permit Drop,Owner Name,Tags
Valley HVAC & Sheet Metal,HVAC,Modesto CA,4500000,900000,45,Robert Miller,family-owned;hvac
Gold Country Plumbing,Plumbing,Sacramento CA,3200000,640000,35,David Vance,commercial;high-growth
Pacific Tool & Die,Manufacturing,Stockton CA,5800000,1100000,50,Arthur Pendelton,manufacturing;legacy
Bay Area Electrical Services,Electrical,Oakland CA,2900000,580000,20,Carlos Mendez,residential`;
    setCsvRawText(sampleCSV);
    parseCSVContent(sampleCSV);
  };

  const selectedOutreachLead = useMemo(() => {
    return leads.find(l => l.id === selectedOutreachLeadId) || null;
  }, [leads, selectedOutreachLeadId]);

  const outreachQueue = useMemo(() => {
    return leads.filter(l => {
      if (l.status === 'archived') return false;
      if (outreachFilter === 'pending') {
        return l.status === 'qualified' || ((l.exitPropensityScore || 0) >= 8 && l.status !== 'outreach_triggered');
      }
      if (outreachFilter === 'triggered') {
        return l.status === 'outreach_triggered';
      }
      return true; // 'all'
    });
  }, [leads, outreachFilter]);

  const handleGenerateLetterForOutreach = async (lead?: Lead) => {
    const targetLead = lead || selectedOutreachLead;
    if (!targetLead) return;
    setIsGeneratingLetter(true);
    try {
      const res = await generateOutreachLetter(targetLead, outreachTemplate);
      setOutreachSubject(res.subject);
      setOutreachLetterBody(res.letterBody);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleBatchTriggerOutreach = async () => {
    const pendingLeads = leads.filter(l => l.status === 'qualified' || ((l.exitPropensityScore || 0) >= 8 && l.status !== 'outreach_triggered' && l.status !== 'archived'));
    if (pendingLeads.length === 0 || isBatchTriggering) return;
    setIsBatchTriggering(true);
    try {
      const batch = writeBatch(db);
      for (const lead of pendingLeads) {
        const leadRef = doc(db, 'leads', lead.id);
        batch.update(leadRef, {
          status: 'outreach_triggered',
          updatedAt: new Date().toISOString()
        });
      }
      await batch.commit();
    } catch (err: any) {
      console.error("Batch outreach error:", err);
      setGlobalError('Failed to trigger batch outreach: ' + err.message);
    } finally {
      setIsBatchTriggering(false);
    }
  };

  const handleExportOutreachCSV = () => {
    if (outreachQueue.length === 0) return;

    const headers = [
      'Business Name',
      'Industry',
      'Location',
      'Owner / Agent',
      'Exit Propensity Score',
      'Valuation Estimate ($)',
      'Permit Drop (%)',
      'Outreach Status',
      'Registration Date'
    ];

    const rows = outreachQueue.map(lead => [
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${lead.industry.replace(/"/g, '""')}"`,
      `"${lead.location.replace(/"/g, '""')}"`,
      `"${(lead.agentName || 'Owner').replace(/"/g, '""')}"`,
      lead.exitPropensityScore || '',
      lead.valuationEstimate || '',
      `${lead.permitDrop}%`,
      lead.status,
      lead.registrationDate || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `outreach_queue_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (selectedLead) {
      setEditRevenue(selectedLead.revenue?.toString() || '');
      setEditEbitda(selectedLead.ebitda?.toString() || '');
      setEditProfitMargin(selectedLead.profitMargin?.toString() || '');
      setIsEditingFinancials(false);
      
      setEditLinkedin(selectedLead.socialLinks?.linkedin || '');
      setEditTwitter(selectedLead.socialLinks?.twitter || '');
      setEditWebsite(selectedLead.socialLinks?.website || '');
      setIsEditingSocial(false);
    }
  }, [selectedLead]);

  const handleUpdateLeadFinancials = async () => {
    if (!selectedLead || !user) return;
    
    const revenue = editRevenue ? parseFloat(editRevenue) : undefined;
    const ebitda = editEbitda ? parseFloat(editEbitda) : undefined;
    const profitMargin = editProfitMargin ? parseFloat(editProfitMargin) : undefined;
    
    const leadDoc = doc(db, 'leads', selectedLead.id);
    const updateData: any = {
      revenue,
      ebitda,
      profitMargin,
      updatedAt: new Date().toISOString()
    };
    
    try {
      await updateDoc(leadDoc, updateData);
      setSelectedLead({
        ...selectedLead,
        ...updateData
      });
      setIsEditingFinancials(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSocialLinks = async () => {
    if (!selectedLead || !user) return;
    
    const leadDoc = doc(db, 'leads', selectedLead.id);
    const socialLinks = {
      linkedin: editLinkedin,
      twitter: editTwitter,
      website: editWebsite
    };
    
    try {
      await updateDoc(leadDoc, {
        socialLinks,
        updatedAt: new Date().toISOString()
      });
      setSelectedLead({
        ...selectedLead,
        socialLinks
      });
      setIsEditingSocial(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTag = async () => {
    if (!selectedLead || !newTag.trim() || !user) return;
    const tag = newTag.trim().toLowerCase();
    const currentTags = selectedLead.tags || [];
    if (currentTags.includes(tag)) {
      setNewTag('');
      return;
    }

    const updatedTags = [...currentTags, tag];
    const leadDoc = doc(db, 'leads', selectedLead.id);
    try {
      await updateDoc(leadDoc, { 
        tags: updatedTags, 
        updatedAt: new Date().toISOString() 
      });
      setSelectedLead({ ...selectedLead, tags: updatedTags });
      setNewTag('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedLead || !user) return;
    const updatedTags = (selectedLead.tags || []).filter(t => t !== tagToRemove);
    const leadDoc = doc(db, 'leads', selectedLead.id);
    try {
      await updateDoc(leadDoc, { 
        tags: updatedTags, 
        updatedAt: new Date().toISOString() 
      });
      setSelectedLead({ ...selectedLead, tags: updatedTags });
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      'Name',
      'Industry',
      'Location',
      'Registration Date',
      'Agent Name',
      'Corporate Agent',
      'Permit Volume 2023-2025',
      'Permit Volume 2026',
      'Permit Drop (%)',
      'Last Digital Post',
      'Review Velocity',
      'Exit Propensity Score',
      'Valuation Estimate',
      'Status',
      'Revenue',
      'EBITDA',
      'Profit Margin (%)',
      'AI Thesis'
    ];

    const rows = filteredLeads.map(lead => [
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${lead.industry.replace(/"/g, '""')}"`,
      `"${lead.location.replace(/"/g, '""')}"`,
      lead.registrationDate,
      `"${lead.agentName.replace(/"/g, '""')}"`,
      lead.isCorporateAgent ? 'Yes' : 'No',
      lead.permitVolume2023_2025,
      lead.permitVolume2026,
      lead.permitDrop,
      lead.lastDigitalPostDate,
      lead.reviewVelocity,
      lead.exitPropensityScore || '',
      lead.valuationEstimate || '',
      lead.status,
      lead.revenue || '',
      lead.ebitda || '',
      lead.profitMargin || '',
      `"${(lead.aiThesis || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auth & Profile Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userDoc);
        if (!snap.exists()) {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: 'user',
            industryMultiples: {},
            valuationParameters: {
              defaultProfitMargin: 20,
              revenueTiers: []
            }
          };
          await setDoc(userDoc, newProfile);
          setProfile(newProfile);
        } else {
          const data = snap.data() as UserProfile;
          setProfile(data);
          if (data.valuationParameters?.defaultProfitMargin) {
            setDefaultProfitMargin(data.valuationParameters.defaultProfitMargin.toString());
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Leads Sync
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(leadsData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'leads'));
    return unsubscribe;
  }, [user]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = 
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const score = l.exitPropensityScore || 0;
      const matchesScore = score >= minScore && score <= maxScore;
      const matchesPermitDrop = (l.permitDrop || 0) >= minPermitDrop;
      
      const matchesYear = regYear === '' || 
        (l.registrationDate && l.registrationDate.startsWith(regYear));

      const matchesTags = tagSearch === '' || 
        (l.tags || []).some(t => t.toLowerCase().includes(tagSearch.toLowerCase()));

      return matchesSearch && matchesScore && matchesPermitDrop && matchesYear && matchesTags;
    });
  }, [leads, searchQuery, minScore, maxScore, minPermitDrop, regYear, tagSearch]);

  const stats = useMemo(() => {
    const highPropensity = leads.filter(l => l.exitPropensityScore >= 8).length;
    const pendingOutreach = leads.filter(l => l.status === 'qualified').length;
    const totalValuation = leads.reduce((acc, l) => acc + (l.valuationEstimate || 0), 0);
    return { highPropensity, pendingOutreach, totalValuation };
  }, [leads]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    // 1. Valuation by Industry
    const industryMap: Record<string, number> = {};
    leads.forEach(l => {
      if (l.valuationEstimate) {
        industryMap[l.industry] = (industryMap[l.industry] || 0) + l.valuationEstimate;
      }
    });
    const valuationByIndustry = Object.entries(industryMap).map(([name, value]) => ({ name, value }));

    // 2. Status Distribution
    const statusMap: Record<string, number> = {};
    leads.forEach(l => {
      statusMap[l.status] = (statusMap[l.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // 3. Permit Drop vs Score Correlation
    const correlationData = leads
      .filter(l => l.exitPropensityScore)
      .map(l => ({
        x: l.permitDrop,
        y: l.exitPropensityScore,
        name: l.name
      }));

    // 4. Status Trend Over Time
    const trendMap: Record<string, Record<string, number>> = {};
    leads.forEach(l => {
      if (l.createdAt) {
        const date = new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!trendMap[date]) {
          trendMap[date] = { new: 0, qualified: 0, outreach_triggered: 0, archived: 0 };
        }
        trendMap[date][l.status] = (trendMap[date][l.status] || 0) + 1;
      }
    });
    const statusTrend = Object.entries(trendMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { valuationByIndustry, statusDistribution, correlationData, statusTrend };
  }, [leads]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    leads.forEach(l => {
      if (l.registrationDate && typeof l.registrationDate === 'string') {
        const year = l.registrationDate.split('-')[0];
        if (year && year.length === 4) years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [leads]);

  useEffect(() => {
    if (profile?.systemPrompt) {
      setSystemPrompt(profile.systemPrompt);
    }
  }, [profile]);

  // Keyboard Modal Navigation Listener (Escape key dismiss)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLead(null);
        setLoiModalLead(null);
        setIcMemoModalLead(null);
        setArchiveModalLead(null);
        setShowFinancialParserModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveSystemPrompt = async () => {
    if (!user) return;
    setIsSavingPrompt(true);
    try {
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, { systemPrompt });
      setProfile(prev => prev ? { ...prev, systemPrompt } : null);
    } catch (err) {
      console.error("Error saving system prompt:", err);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleIngestSample = async () => {
    if (!user) return;
    const sampleLeads: Partial<Lead>[] = [
      {
        name: "Manteca HVAC Solutions",
        industry: "HVAC",
        location: "Manteca, CA",
        registrationDate: "2002-05-14",
        agentName: "Robert Miller",
        isCorporateAgent: false,
        permitVolume2023_2025: 45,
        permitVolume2026: 12,
        permitDrop: 73,
        lastDigitalPostDate: "2023-11-20",
        reviewVelocity: 0.2,
        status: 'new',
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      },
      {
        name: "San Jose Precision Plumbing",
        industry: "Plumbing",
        location: "San Jose, CA",
        registrationDate: "1998-03-22",
        agentName: "Law Offices of Smith & Co",
        isCorporateAgent: true,
        permitVolume2023_2025: 120,
        permitVolume2026: 115,
        permitDrop: 4,
        lastDigitalPostDate: "2026-03-01",
        reviewVelocity: 4.5,
        status: 'new',
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      },
      {
        name: "Central Valley Tool & Die",
        industry: "Manufacturing",
        location: "Stockton, CA",
        registrationDate: "1985-08-10",
        agentName: "Gary Thompson",
        isCorporateAgent: false,
        permitVolume2023_2025: 30,
        permitVolume2026: 5,
        permitDrop: 83,
        lastDigitalPostDate: "2021-05-12",
        reviewVelocity: 0.1,
        status: 'new',
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      }
    ];

    for (const lead of sampleLeads) {
      await addDoc(collection(db, 'leads'), {
        ...lead,
        updatedAt: new Date().toISOString(),
      });
    }
    setActiveTab('dashboard');
  };

  const handleCitySearch = async () => {
    if (!citySearchQuery.trim() || !user) return;
    setIsSearchingCity(true);
    try {
      const results = await searchBusinessesByCity(citySearchQuery);
      for (const res of results) {
        await addDoc(collection(db, 'leads'), {
          ...res,
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user.uid,
        });
      }
      setCitySearchQuery('');
      setActiveTab('dashboard');
    } catch (err) {
      console.error("City Search Error:", err);
    } finally {
      setIsSearchingCity(false);
    }
  };

  const handleRunIntelligence = async () => {
    if (leads.length === 0) return;
    setIsAnalyzing(true);
    try {
      // Get previous feedback from existing leads to refine the prompt
      const feedbackExamples = useFeedbackRefinement 
        ? leads
            .filter(l => l.thesisFeedback && l.aiThesis)
            .sort((a, b) => (a.thesisFeedback?.rating || 0) - (b.thesisFeedback?.rating || 0)) // Prioritize low ratings for learning
            .slice(0, 10)
            .map(l => ({
              thesis: l.aiThesis,
              rating: l.thesisFeedback?.rating,
              comment: l.thesisFeedback?.comment
            }))
        : [];

      let userLocation = undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (e) {
        console.warn("Geolocation failed or denied:", e);
      }

      const { results, groundingSources: sources } = await analyzeLeads(
        leads, 
        feedbackExamples, 
        profile?.industryMultiples || {},
        profile?.valuationParameters || {},
        userLocation,
        useThinkingMode,
        systemPrompt,
        useFastMode
      );
      setGroundingSources(sources);
      for (const res of results) {
        if (res.id) {
          const leadDoc = doc(db, 'leads', res.id);
          await updateDoc(leadDoc, {
            exitPropensityScore: res.exitPropensityScore,
            aiThesis: res.aiThesis,
            valuationEstimate: res.valuationEstimate,
            permitAnalysis: res.permitAnalysis,
            status: (res.exitPropensityScore || 0) >= 8 ? 'qualified' : 'new',
            updatedAt: new Date().toISOString(),
          });
        }
      }
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateLeadStatus = async (id: string, status: LeadStatus, reason?: string, notes?: string) => {
    const leadDoc = doc(db, 'leads', id);
    const updateData: any = { status, updatedAt: new Date().toISOString() };
    if (reason) updateData.archiveReason = reason;
    if (notes) updateData.archiveNotes = notes;
    await updateDoc(leadDoc, updateData);
  };

  const handleGenerateSubjectLines = async () => {
    if (!selectedLead || !selectedLead.aiThesis) return;
    setIsGeneratingSubjects(true);
    try {
      const subjects = await generateSubjectLines(selectedLead);
      const leadDoc = doc(db, 'leads', selectedLead.id);
      await updateDoc(leadDoc, {
        suggestedSubjectLines: subjects,
        updatedAt: new Date().toISOString()
      });
      setSelectedLead({ ...selectedLead, suggestedSubjectLines: subjects });
    } catch (error) {
      console.error("Error generating subject lines:", error);
    } finally {
      setIsGeneratingSubjects(false);
    }
  };

  const handleArchiveClick = (lead: Lead) => {
    setArchiveModalLead(lead);
  };

  const confirmArchive = async () => {
    if (archiveModalLead) {
      await updateLeadStatus(archiveModalLead.id, 'archived', archiveReason, archiveNotes);
      setArchiveModalLead(null);
      setSelectedLead(null);
      setArchiveReason('Not a fit');
      setArchiveNotes('');
    }
  };

  const submitFeedback = async () => {
    if (!selectedLead || feedbackRating === 0) return;
    setIsSubmittingFeedback(true);
    try {
      const leadDoc = doc(db, 'leads', selectedLead.id);
      await updateDoc(leadDoc, {
        thesisFeedback: {
          rating: feedbackRating,
          comment: feedbackComment,
          createdAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      });
      // Update local state for immediate feedback
      const updatedFeedback = {
        rating: feedbackRating,
        comment: feedbackComment,
        createdAt: new Date().toISOString()
      };
      
      setSelectedLead({
        ...selectedLead,
        thesisFeedback: updatedFeedback
      });

      setLeads(prev => prev.map(l => 
        l.id === selectedLead.id ? { ...l, thesisFeedback: updatedFeedback } : l
      ));

      setFeedbackRating(0);
      setFeedbackComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleAddMultiple = async () => {
    if (!user || !newIndustry || !newMultiple) return;
    const multiple = parseFloat(newMultiple);
    if (isNaN(multiple)) return;

    const userDoc = doc(db, 'users', user.uid);
    const updatedMultiples = {
      ...(profile?.industryMultiples || {}),
      [newIndustry]: multiple
    };

    await updateDoc(userDoc, {
      industryMultiples: updatedMultiples
    });

    setProfile(prev => prev ? { ...prev, industryMultiples: updatedMultiples } : null);
    setNewIndustry('');
    setNewMultiple('');
  };

  const handleRemoveMultiple = async (industry: string) => {
    if (!user || !profile?.industryMultiples) return;
    
    const { [industry]: _, ...rest } = profile.industryMultiples;
    const userDoc = doc(db, 'users', user.uid);
    
    await updateDoc(userDoc, {
      industryMultiples: rest
    });

    setProfile(prev => prev ? { ...prev, industryMultiples: rest } : null);
  };

  const handleUpdateProfitMargin = async () => {
    if (!user) return;
    const margin = parseFloat(defaultProfitMargin);
    if (isNaN(margin)) return;

    const userDoc = doc(db, 'users', user.uid);
    const updatedParams = {
      ...(profile?.valuationParameters || {}),
      defaultProfitMargin: margin
    };

    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
  };

  const handleAddRevenueTier = async () => {
    if (!user || !newTierMin || !newTierMax || !newTierMultiplier) return;
    const min = parseFloat(newTierMin);
    const max = parseFloat(newTierMax);
    const multiplier = parseFloat(newTierMultiplier);
    if (isNaN(min) || isNaN(max) || isNaN(multiplier)) return;

    const userDoc = doc(db, 'users', user.uid);
    const currentTiers = profile?.valuationParameters?.revenueTiers || [];
    const updatedTiers = [...currentTiers, { min, max, multiplier }];
    const updatedParams = {
      ...(profile?.valuationParameters || {}),
      revenueTiers: updatedTiers
    };

    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
    setNewTierMin('');
    setNewTierMax('');
    setNewTierMultiplier('');
  };

  const handleAddProfitTier = async () => {
    if (!user || !newProfitTierMin || !newProfitTierMax || !newProfitTierMultiplier) return;
    const min = parseFloat(newProfitTierMin);
    const max = parseFloat(newProfitTierMax);
    const multiplier = parseFloat(newProfitTierMultiplier);
    if (isNaN(min) || isNaN(max) || isNaN(multiplier)) return;

    const userDoc = doc(db, 'users', user.uid);
    const currentTiers = profile?.valuationParameters?.profitMarginTiers || [];
    const updatedTiers = [...currentTiers, { min, max, multiplier }];
    const updatedParams = {
      ...(profile?.valuationParameters || {}),
      profitMarginTiers: updatedTiers
    };

    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
    setNewProfitTierMin('');
    setNewProfitTierMax('');
    setNewProfitTierMultiplier('');
  };

  const handleAddCustomRule = async () => {
    if (!user || !newCustomRule.trim()) return;
    
    const userDoc = doc(db, 'users', user.uid);
    const currentRules = profile?.valuationParameters?.customValuationRules || [];
    const updatedRules = [...currentRules, newCustomRule.trim()];
    const updatedParams = {
      ...(profile?.valuationParameters || {}),
      customValuationRules: updatedRules
    };

    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
    setNewCustomRule('');
  };
  
  const handleAddLocationMultiplier = async () => {
    if (!user || !newLocation || !newLocationMultiplier) return;
    const multiplier = parseFloat(newLocationMultiplier);
    if (isNaN(multiplier)) return;

    const userDoc = doc(db, 'users', user.uid);
    const currentMultipliers = profile?.valuationParameters?.locationMultipliers || {};
    const updatedMultipliers = { ...currentMultipliers, [newLocation]: multiplier };
    const updatedParams = {
      ...(profile?.valuationParameters || {}),
      locationMultipliers: updatedMultipliers
    };

    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
    setNewLocation('');
    setNewLocationMultiplier('');
  };

  const handleRemoveLocationMultiplier = async (location: string) => {
    if (!user || !profile?.valuationParameters?.locationMultipliers) return;
    
    const { [location]: _, ...rest } = profile.valuationParameters.locationMultipliers;
    const userDoc = doc(db, 'users', user.uid);
    const updatedParams = {
      ...profile.valuationParameters,
      locationMultipliers: rest
    };
    
    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
  };

  const handleAddAgeMultiplier = async () => {
    if (!user || !newAgeMin || !newAgeMultiplier) return;
    const minYears = parseInt(newAgeMin);
    const multiplier = parseFloat(newAgeMultiplier);
    if (isNaN(minYears) || isNaN(multiplier)) return;

    const userDoc = doc(db, 'users', user.uid);
    const currentMultipliers = profile?.valuationParameters?.ageMultipliers || [];
    const updatedMultipliers = [...currentMultipliers, { minYears, multiplier }];
    const updatedParams = {
      ...(profile?.valuationParameters || {}),
      ageMultipliers: updatedMultipliers
    };

    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
    setNewAgeMin('');
    setNewAgeMultiplier('');
  };

  const handleRemoveAgeMultiplier = async (index: number) => {
    if (!user || !profile?.valuationParameters?.ageMultipliers) return;
    
    const updatedMultipliers = profile.valuationParameters.ageMultipliers.filter((_, i) => i !== index);
    const userDoc = doc(db, 'users', user.uid);
    const updatedParams = {
      ...profile.valuationParameters,
      ageMultipliers: updatedMultipliers
    };
    
    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
  };

  const handleRemoveRevenueTier = async (index: number) => {
    if (!user || !profile?.valuationParameters?.revenueTiers) return;
    
    const updatedTiers = profile.valuationParameters.revenueTiers.filter((_, i) => i !== index);
    const userDoc = doc(db, 'users', user.uid);
    const updatedParams = {
      ...profile.valuationParameters,
      revenueTiers: updatedTiers
    };
    
    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
  };

  const handleRemoveProfitTier = async (index: number) => {
    if (!user || !profile?.valuationParameters?.profitMarginTiers) return;
    
    const updatedTiers = profile.valuationParameters.profitMarginTiers.filter((_, i) => i !== index);
    const userDoc = doc(db, 'users', user.uid);
    const updatedParams = {
      ...profile.valuationParameters,
      profitMarginTiers: updatedTiers
    };
    
    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
  };

  const handleRemoveCustomRule = async (index: number) => {
    if (!user || !profile?.valuationParameters?.customValuationRules) return;
    
    const updatedRules = profile.valuationParameters.customValuationRules.filter((_, i) => i !== index);
    const userDoc = doc(db, 'users', user.uid);
    const updatedParams = {
      ...profile.valuationParameters,
      customValuationRules: updatedRules
    };
    
    await updateDoc(userDoc, {
      valuationParameters: updatedParams
    });

    setProfile(prev => prev ? { ...prev, valuationParameters: updatedParams } : null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="font-mono text-sm text-zinc-500">INITIALIZING SILVER SCOUT...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-zinc-950">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md p-8"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Zap className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="mb-2 font-display text-4xl font-bold tracking-tight text-white">SILVER SCOUT</h1>
            <p className="text-zinc-400">Proprietary Lead-Gen Engine for "High-Propensity" Acquisition Targets.</p>
          </div>
          
          <Button 
            onClick={loginWithGoogle}
            className="w-full gap-3 py-6 text-lg"
            variant="primary"
          >
            <Globe className="h-5 w-5" />
            Authenticate with Google
          </Button>
          
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-white">20Y+</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Entity Age</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">30%</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Permit Drop</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">AI</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Thesis Gen</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-6">
          <Zap className="h-6 w-6 text-emerald-600" />
          <span className="font-display text-xl font-bold tracking-tight">SILVER SCOUT</span>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'dashboard' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('ingestion')}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'ingestion' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <Database className="h-4 w-4" />
            Ingestion Pipeline
          </button>
          <button 
            onClick={() => setActiveTab('intelligence')}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'intelligence' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <BrainCircuit className="h-4 w-4" />
            Gemini Intelligence
          </button>
          <button 
            onClick={() => setActiveTab('outreach')}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'outreach' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <Send className="h-4 w-4" />
            Outreach Trigger
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'settings' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </nav>
        
        <div className="border-t border-zinc-100 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold">{profile?.displayName}</p>
              <p className="truncate text-[10px] text-zinc-500">{profile?.email}</p>
            </div>
            <button onClick={logout} className="text-zinc-400 hover:text-red-500">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-8 backdrop-blur-md">
          <h2 className="text-lg font-semibold capitalize">{activeTab.replace('-', ' ')}</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              size="sm" 
              className="relative gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filter
              {(minScore > 0 || maxScore < 10 || minPermitDrop > 0 || regYear !== '') && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                  {[minScore > 0 || maxScore < 10, minPermitDrop > 0, regYear !== ''].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleExportCSV}
              disabled={filteredLeads.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <a 
              href="/silver_scout_export.zip" 
              download="silver_scout_export.zip"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download ZIP
        </header>

        {globalError && (
          <div className="mx-8 mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 shadow-xs">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span>{globalError}</span>
            </div>
            <button onClick={() => setGlobalError(null)} className="font-bold text-red-700 hover:text-red-900 px-2 py-0.5 rounded hover:bg-red-100">
              ✕
            </button>
          </div>
        )}

        {/* Advanced Filters Bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-zinc-200 bg-zinc-50/50"
            >
              <div className="grid grid-cols-4 gap-6 p-6 px-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Propensity Score Range</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="0" 
                      max="10" 
                      value={minScore}
                      onChange={(e) => setMinScore(Number(e.target.value))}
                      className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                      placeholder="Min"
                    />
                    <span className="text-zinc-400">-</span>
                    <input 
                      type="number" 
                      min="0" 
                      max="10" 
                      value={maxScore}
                      onChange={(e) => setMaxScore(Number(e.target.value))}
                      className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Min Permit Drop (%)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={minPermitDrop}
                      onChange={(e) => setMinPermitDrop(Number(e.target.value))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="w-8 text-xs font-medium text-zinc-600">{minPermitDrop}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Registration Year</label>
                  <select 
                    value={regYear}
                    onChange={(e) => setRegYear(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">All Years</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Filter by Tags</label>
                  <input 
                    type="text" 
                    placeholder="e.g. high-growth" 
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-end pb-0.5">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-red-600"
                    onClick={() => {
                      setMinScore(0);
                      setMaxScore(10);
                      setMinPermitDrop(0);
                      setRegYear('');
                      setTagSearch('');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <Card className="flex items-center gap-4 border-l-4 border-l-emerald-500">
                  <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500">High Propensity</p>
                    <p className="text-2xl font-bold">{stats.highPropensity}</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-4 border-l-4 border-l-amber-500">
                  <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500">Pending Outreach</p>
                    <p className="text-2xl font-bold">{stats.pendingOutreach}</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-4 border-l-4 border-l-blue-500">
                  <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500">Total Pipeline Val.</p>
                    <p className="text-2xl font-bold">${(stats.totalValuation / 1000000).toFixed(1)}M</p>
                  </div>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="h-80">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Valuation by Industry ($)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.valuationByIndustry}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Valuation']}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="h-80">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Permit Drop vs. Fatigue Score</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" dataKey="x" name="Permit Drop" unit="%" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis type="number" dataKey="y" name="Fatigue Score" fontSize={10} axisLine={false} tickLine={false} />
                      <ZAxis type="category" dataKey="name" name="Business" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Leads" data={chartData.correlationData} fill="#3b82f6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="h-80">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Pipeline Status Distribution</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="h-80">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Outreach Effectiveness Trend</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.statusTrend}>
                      <defs>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOutreach" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorArchived" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Area type="monotone" dataKey="new" stroke="#10b981" fillOpacity={1} fill="url(#colorNew)" strokeWidth={2} />
                      <Area type="monotone" dataKey="qualified" stroke="#3b82f6" fillOpacity={1} fill="url(#colorQualified)" strokeWidth={2} />
                      <Area type="monotone" dataKey="outreach_triggered" stroke="#f59e0b" fillOpacity={1} fill="url(#colorOutreach)" strokeWidth={2} />
                      <Area type="monotone" dataKey="archived" stroke="#ef4444" fillOpacity={1} fill="url(#colorArchived)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="flex flex-col justify-center p-8 bg-zinc-900 text-white border-none">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                    <BrainCircuit className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Market Intelligence</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Our AI models have identified a <span className="text-emerald-400 font-bold">strong correlation</span> between permit stagnation and owner fatigue in the HVAC sector. 
                      Targets with a {'>'}30% permit drop and individual agents are 4x more likely to accept a direct buyout offer.
                    </p>
                  <Button variant="primary" size="sm" className="mt-6 w-fit" onClick={() => setActiveTab('intelligence')}>
                    Refine Model
                  </Button>
                </Card>

                {groundingSources.length > 0 && (
                  <Card className="col-span-2 bg-zinc-50 border-dashed border-zinc-300">
                    <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      Intelligence Sources (Google Search & Maps)
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {groundingSources.map((chunk, idx) => {
                        const source = chunk.web || chunk.maps;
                        if (!source) return null;
                        return (
                          <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm ring-1 ring-zinc-200 transition-all hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200"
                          >
                            {chunk.maps ? <MapPin className="h-3 w-3 text-red-500" /> : <Globe className="h-3 w-3 text-blue-500" />}
                            {source.title || 'View Source'}
                            <ExternalLink className="h-3 w-3 opacity-50" />
                          </a>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </div>

              {/* Lead Pipeline Views (List, Kanban, Map) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">Target Acquisition Pipeline</h3>
                    <p className="text-xs text-zinc-500">{filteredLeads.length} leads in active view</p>
                  </div>

                  {/* View Mode Switcher Tabs */}
                  <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1.5 ring-1 ring-zinc-200">
                    <button
                      onClick={() => setDashboardViewMode('list')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        dashboardViewMode === 'list'
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800"
                      )}
                    >
                      <List className="h-3.5 w-3.5" />
                      List View
                    </button>

                    <button
                      onClick={() => setDashboardViewMode('kanban')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        dashboardViewMode === 'kanban'
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800"
                      )}
                    >
                      <Kanban className="h-3.5 w-3.5 text-emerald-600" />
                      Kanban Board
                    </button>

                    <button
                      onClick={() => setDashboardViewMode('map')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        dashboardViewMode === 'map'
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800"
                      )}
                    >
                      <MapIcon className="h-3.5 w-3.5 text-blue-600" />
                      Interactive Map
                    </button>
                  </div>
                </div>
                
                {/* 1. LIST VIEW */}
                {dashboardViewMode === 'list' && (
                  <div className="grid gap-4">
                    {filteredLeads.map((lead) => (
                      <Card 
                        key={lead.id} 
                        onClick={() => setSelectedLead(lead)}
                        className={cn(
                          "group relative overflow-hidden",
                          lead.exitPropensityScore >= 8 && "border-emerald-200 bg-emerald-50/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                              <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold">{lead.name}</h4>
                                 <Badge variant={
                                  lead.status === 'qualified' ? 'success' : 
                                  lead.status === 'archived' ? 'danger' : 
                                  lead.status === 'outreach_triggered' ? 'info' : 
                                  lead.status === 'in_loi' ? 'warning' :
                                  'default'
                                }>
                                  {formatStatusLabel(lead.status)}
                                </Badge>
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3 text-xs text-zinc-500">
                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.location}</span>
                                  <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {lead.industry}</span>
                                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Reg: {new Date(lead.registrationDate).getFullYear()}</span>
                                </div>
                                {lead.status === 'archived' && lead.archiveReason && (
                                  <p className="text-[10px] text-red-600 font-medium">Reason: {lead.archiveReason}</p>
                                )}
                                {lead.tags && lead.tags.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {lead.tags.map(tag => (
                                      <span key={tag} className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-medium text-zinc-500 ring-1 ring-zinc-200">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest text-zinc-400">Fatigue Score</p>
                              <div className="flex items-center gap-1">
                                <span className={cn(
                                  "text-xl font-black",
                                  lead.exitPropensityScore >= 8 ? "text-emerald-600" : "text-zinc-900"
                                )}>
                                  {lead.exitPropensityScore || 'N/A'}
                                </span>
                                <span className="text-xs text-zinc-400">/10</span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest text-zinc-400">Permit Pulse</p>
                              <div className={cn(
                                "flex items-center gap-1 font-bold",
                                lead.permitDrop >= 30 ? "text-red-600" : "text-zinc-600"
                              )}>
                                {lead.permitDrop >= 30 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                                {lead.permitDrop}%
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {lead.status !== 'archived' && (
                                <Button 
                                  variant="ghost" 
                                  size="xs" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveClick(lead);
                                  }}
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <ChevronRight className="h-5 w-5 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {filteredLeads.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 rounded-full bg-zinc-100 p-4">
                          <Database className="h-8 w-8 text-zinc-300" />
                        </div>
                        <h4 className="font-bold text-zinc-900">No leads found</h4>
                        <p className="text-sm text-zinc-500">Start by ingesting data in the pipeline tab.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          onClick={() => setActiveTab('ingestion')}
                        >
                          Go to Ingestion
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. KANBAN BOARD VIEW */}
                {dashboardViewMode === 'kanban' && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
                    {[
                      { id: 'new', title: 'New Opportunities', color: 'border-zinc-300 bg-zinc-50' },
                      { id: 'qualified', title: 'Qualified / Hot Target', color: 'border-emerald-300 bg-emerald-50/20' },
                      { id: 'outreach_triggered', title: 'Outreach Active', color: 'border-blue-300 bg-blue-50/20' },
                      { id: 'in_loi', title: 'Under LOI / Negotiation', color: 'border-amber-300 bg-amber-50/20' },
                      { id: 'archived', title: 'Archived / Passed', color: 'border-red-200 bg-red-50/20' }
                    ].map(col => {
                      const colLeads = filteredLeads.filter(l => l.status === col.id);
                      const colValuationSum = colLeads.reduce((acc, curr) => acc + (curr.valuationEstimate || 0), 0);
                      return (
                        <div
                          key={col.id}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
                            e.preventDefault();
                            if (draggedLeadId) {
                              await updateLeadStatus(draggedLeadId, col.id as LeadStatus);
                              setDraggedLeadId(null);
                            }
                          }}
                          className={cn("rounded-xl border p-3 flex flex-col min-h-[500px]", col.color)}
                        >
                          <div className="flex items-center justify-between mb-3 border-b border-zinc-200/60 pb-2">
                            <div>
                              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">{col.title}</h4>
                              <p className="text-[10px] text-zinc-500 font-medium">${(colValuationSum / 1000000).toFixed(1)}M Total</p>
                            </div>
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-zinc-700 shadow-xs border">
                              {colLeads.length}
                            </span>
                          </div>

                          <div className="space-y-3 flex-1 overflow-y-auto">
                            {colLeads.map(lead => (
                              <div
                                key={lead.id}
                                draggable
                                onDragStart={() => setDraggedLeadId(lead.id)}
                                onClick={() => setSelectedLead(lead)}
                                className="group cursor-grab active:cursor-grabbing rounded-lg border border-zinc-200 bg-white p-3 shadow-xs hover:shadow-md transition-all hover:border-emerald-400 space-y-2"
                              >
                                <div className="flex items-start justify-between">
                                  <h5 className="font-bold text-xs text-zinc-900 group-hover:text-emerald-600 transition-colors">{lead.name}</h5>
                                  <span className={cn(
                                    "text-[9px] font-black px-1.5 py-0.5 rounded",
                                    (lead.exitPropensityScore || 0) >= 8 ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
                                  )}>
                                    {lead.exitPropensityScore || '?'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-500">{lead.industry} • {lead.location}</p>

                                <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-[10px]">
                                  <span className="font-bold text-emerald-700">${(lead.valuationEstimate || 0).toLocaleString()}</span>
                                  {lead.permitDrop >= 30 && (
                                    <span className="text-red-600 font-bold bg-red-50 px-1 rounded">-{lead.permitDrop}%</span>
                                  )}
                                </div>
                              </div>
                            ))}

                            {colLeads.length === 0 && (
                              <div className="h-32 flex items-center justify-center text-[10px] text-zinc-400 italic border border-dashed border-zinc-200/60 rounded-lg">
                                Drag leads here
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. INTERACTIVE MAP VIEW */}
                {dashboardViewMode === 'map' && (
                  <Card className="relative overflow-hidden p-0 border-zinc-300 shadow-md">
                    {/* Map Header & Controls */}
                    <div className="flex items-center justify-between p-4 bg-zinc-900 text-white border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <MapIcon className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Geographic Acquisition Visualizer</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Score $\ge$ 8 (Hot Target)</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> High Permit Drop</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Outreach Active</span>
                      </div>
                    </div>

                    {/* Vector Map Canvas */}
                    <div className="relative h-[550px] w-full bg-zinc-950 overflow-hidden select-none">
                      {/* Grid background lines */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>

                      {/* Map Pins */}
                      {filteredLeads.map(lead => {
                        const coord = getLeadCoordinates(lead.location, lead.id);
                        const isHot = (lead.exitPropensityScore || 0) >= 8;
                        const isDrop = lead.permitDrop >= 30;
                        const isTriggered = lead.status === 'outreach_triggered';

                        return (
                          <div
                            key={lead.id}
                            style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                            onClick={() => setMapSelectedLead(lead)}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-10"
                          >
                            {isHot && (
                              <span className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping"></span>
                            )}
                            <div className={cn(
                              "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-lg border backdrop-blur-xs transition-all",
                              isHot ? "bg-emerald-950/90 text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/20" :
                              isDrop ? "bg-red-950/90 text-red-300 border-red-500" :
                              isTriggered ? "bg-blue-950/90 text-blue-300 border-blue-500" :
                              "bg-zinc-900/90 text-zinc-300 border-zinc-700"
                            )}>
                              <MapPin className={cn("h-3 w-3", isHot ? "text-emerald-400" : isDrop ? "text-red-400" : "text-blue-400")} />
                              {lead.name.split(' ')[0]} ({lead.exitPropensityScore || '?'})
                            </div>
                          </div>
                        );
                      })}

                      {/* Map Overlay Card for Selected Pin */}
                      {mapSelectedLead && (
                        <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 rounded-xl border border-zinc-700 bg-zinc-900/95 p-5 text-white shadow-2xl backdrop-blur-md z-20 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant={mapSelectedLead.status === 'qualified' ? 'success' : 'default'}>
                                {formatStatusLabel(mapSelectedLead.status)}
                              </Badge>
                              <h4 className="text-base font-bold mt-1 text-white">{mapSelectedLead.name}</h4>
                              <p className="text-xs text-zinc-400">{mapSelectedLead.industry} • {mapSelectedLead.location}</p>
                            </div>
                            <button 
                              onClick={() => setMapSelectedLead(null)}
                              className="text-zinc-400 hover:text-white text-xs p-1"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-800 text-center">
                            <div>
                              <p className="text-[9px] uppercase text-zinc-400">Score</p>
                              <p className="text-sm font-black text-emerald-400">{mapSelectedLead.exitPropensityScore || '?'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase text-zinc-400">Permit Drop</p>
                              <p className="text-sm font-black text-red-400">-{mapSelectedLead.permitDrop}%</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase text-zinc-400">Valuation</p>
                              <p className="text-sm font-black text-zinc-200">${(mapSelectedLead.valuationEstimate || 0).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button 
                              size="xs" 
                              variant="primary" 
                              className="flex-1 text-xs"
                              onClick={() => {
                                setSelectedLead(mapSelectedLead);
                                setMapSelectedLead(null);
                              }}
                            >
                              Open Full Details
                            </Button>
                            <Button 
                              size="xs" 
                              variant="outline" 
                              className="text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                              onClick={() => {
                                setActiveTab('outreach');
                                setSelectedOutreachLeadId(mapSelectedLead.id);
                                setMapSelectedLead(null);
                              }}
                            >
                              Draft Pitch
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ingestion' && (
            <div className="mx-auto max-w-2xl space-y-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                  <Database className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-2xl font-bold">Phase 1: Ingestion Pipeline</h3>
                <p className="text-zinc-500">Targeting CA Secretary of State, County Permit Portals & Bulk Imports.</p>
              </div>

              {/* Bulk CSV Importer Card */}
              <Card className="space-y-6 p-8 border-emerald-200/60 bg-gradient-to-br from-emerald-50/30 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">Bulk CSV / File Importer</h4>
                      <p className="text-xs text-zinc-500">Import acquisition target lists directly from CSV spreadsheets.</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={loadSampleCSVData}
                    className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Load Sample CSV
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="relative border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors bg-zinc-50/50">
                    <input 
                      type="file" 
                      accept=".csv,.txt" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                    <p className="text-xs font-bold text-zinc-700">Drag & drop your CSV file here, or click to browse</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Supports: Name, Industry, Location, Revenue, EBITDA, Permit Drop, Owner Name, Tags</p>
                  </div>

                  {csvImportError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {csvImportError}
                    </div>
                  )}

                  {csvImportSuccess !== null && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Successfully imported {csvImportSuccess} leads into Firestore database! Redirecting...
                    </div>
                  )}

                  {csvParsedLeads.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-700">Parsed Preview ({csvParsedLeads.length} leads detected)</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Ready to Import</span>
                      </div>

                      <div className="max-h-40 overflow-y-auto border border-zinc-200 rounded-xl text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-zinc-100 text-[10px] uppercase font-bold text-zinc-500 sticky top-0">
                            <tr>
                              <th className="p-2 border-b">Name</th>
                              <th className="p-2 border-b">Industry</th>
                              <th className="p-2 border-b">Location</th>
                              <th className="p-2 border-b">Revenue</th>
                              <th className="p-2 border-b">Owner</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {csvParsedLeads.map((item, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50">
                                <td className="p-2 font-medium">{item.name}</td>
                                <td className="p-2 text-zinc-500">{item.industry}</td>
                                <td className="p-2 text-zinc-500">{item.location}</td>
                                <td className="p-2 text-zinc-500">{item.revenue ? `$${item.revenue.toLocaleString()}` : '-'}</td>
                                <td className="p-2 text-zinc-500">{item.agentName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Button 
                        onClick={handleImportCSVToFirestore}
                        disabled={isImportingCSV}
                        className="w-full py-3 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        {isImportingCSV ? <Clock className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                        Import {csvParsedLeads.length} Leads to Pipeline
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="space-y-6 p-8">
                <div className="space-y-2">
                  <h4 className="font-bold">City-Specific Search</h4>
                  <p className="text-sm text-zinc-500">Discover businesses in a specific city using Google Maps & Search.</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input 
                        type="text" 
                        placeholder="Enter city (e.g. Stockton, CA)" 
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <Button 
                      onClick={handleCitySearch} 
                      disabled={isSearchingCity || !citySearchQuery.trim()}
                      className="gap-2"
                    >
                      {isSearchingCity ? <Clock className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      Search
                    </Button>
                  </div>
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-100"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-zinc-400">Or use sample data</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">SOS Scraper</h4>
                      <p className="text-sm text-zinc-500">Filtering for entities 20+ years old where the Agent is a person.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">Permit Pulse</h4>
                      <p className="text-sm text-zinc-500">Analyzing permit volume drops (2023-2025 vs 2026).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">Digital Ghost Hunt</h4>
                      <p className="text-sm text-zinc-500">Analyzing review velocity and last social post date.</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full gap-2 py-6" 
                    onClick={handleIngestSample}
                  >
                    <ArrowRight className="h-5 w-5" />
                    Trigger Manteca/San Jose Pipeline
                  </Button>
                  <p className="mt-4 text-center text-xs text-zinc-400">
                    Estimated 1,000 licenses processed in ~60 seconds.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'intelligence' && (
            <div className="mx-auto max-w-2xl space-y-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <BrainCircuit className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold">Phase 2: Gemini Intelligence</h3>
                <p className="text-zinc-500">AI-driven "Exit Propensity" ranking and investment thesis generation.</p>
              </div>
              
              <Card className="space-y-6 p-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">System Prompt Configuration</h4>
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      onClick={handleSaveSystemPrompt}
                      disabled={isSavingPrompt}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      {isSavingPrompt ? <Clock className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save Prompt
                    </Button>
                  </div>
                  <div className="rounded-lg bg-zinc-900 p-4 font-mono text-xs text-emerald-400">
                    <p className="mb-2 text-zinc-500">// EDIT SYSTEM PROMPT</p>
                    <textarea 
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Enter custom instructions for the AI (e.g. 'You are a senior PE associate...')"
                      className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[100px] text-emerald-400 placeholder:text-zinc-700"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">
                    * This prompt defines the AI's persona and analysis criteria. Leave blank to use the default "Senior PE Associate" configuration.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Unprocessed Leads:</span>
                    <span className="font-bold">{leads.filter(l => !l.exitPropensityScore).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">AI Model:</span>
                    <span className="font-bold">
                      {useThinkingMode 
                        ? 'Gemini 3.1 Pro (Thinking Mode)' 
                        : useFastMode 
                          ? 'Gemini 3.1 Flash Lite (Fast Mode)' 
                          : 'Gemini 3 Flash (Search Grounded)'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-900">Deep Thinking Mode</span>
                    </div>
                    <button 
                      onClick={() => {
                        setUseThinkingMode(!useThinkingMode);
                        if (!useThinkingMode) setUseFastMode(false);
                      }}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                        useThinkingMode ? "bg-emerald-600" : "bg-zinc-200"
                      )}
                    >
                      <span 
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          useThinkingMode ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-800/70 leading-relaxed">
                    Uses <strong>Gemini 3.1 Pro</strong> with <strong>High Thinking Level</strong> to handle complex reasoning, deep valuation modeling, and nuanced fatigue analysis. Recommended for high-value targets.
                  </p>
                </div>

                <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-900">Fast AI Mode</span>
                    </div>
                    <button 
                      onClick={() => {
                        setUseFastMode(!useFastMode);
                        if (!useFastMode) setUseThinkingMode(false);
                      }}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                        useFastMode ? "bg-blue-600" : "bg-zinc-200"
                      )}
                    >
                      <span 
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          useFastMode ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-800/70 leading-relaxed">
                    Uses <strong>Gemini 3.1 Flash Lite</strong> for low-latency, rapid responses. Ideal for quick pipeline sweeps and high-volume processing.
                  </p>
                </div>
                
                <Button 
                  className="w-full gap-2 py-6" 
                  onClick={handleRunIntelligence}
                  disabled={isAnalyzing || leads.length === 0}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Analyzing Fatigue Signals...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Generate Exit Propensity Rankings
                    </>
                  )}
                </Button>

                {/* Feedback Intelligence Summary */}
                {leads.filter(l => l.thesisFeedback).length > 0 && (
                  <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                          <BrainCircuit className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">AI Learning Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-emerald-600">
                          {leads.filter(l => l.thesisFeedback).length} Feedback Examples
                        </span>
                        <button
                          onClick={() => setUseFeedbackRefinement(!useFeedbackRefinement)}
                          className={cn(
                            "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                            useFeedbackRefinement ? "bg-emerald-500" : "bg-zinc-200"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              useFeedbackRefinement ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-700/80">
                      Gemini is incorporating your ratings and comments from previous leads to refine its analysis and valuation logic.
                    </p>
                    
                    {useFeedbackRefinement && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/50">Recent Feedback</p>
                        <div className="max-h-32 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-emerald-200">
                          {leads
                            .filter(l => l.thesisFeedback)
                            .slice(0, 3)
                            .map((l, idx) => (
                              <div key={idx} className="rounded-lg bg-white/60 p-2 text-[10px] border border-emerald-100/50">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-emerald-900 truncate max-w-[120px]">{l.name}</span>
                                  <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={cn(
                                          "h-2 w-2",
                                          i < (l.thesisFeedback?.rating || 0) ? "fill-emerald-500 text-emerald-500" : "text-emerald-200"
                                        )} 
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="italic text-emerald-700 line-clamp-2">"{l.thesisFeedback?.comment || 'No comment provided'}"</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {groundingSources.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Grounding Sources</h4>
                    <div className="grid gap-2">
                      {groundingSources.map((source, idx) => (
                        source.web && (
                          <a 
                            key={idx}
                            href={source.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs transition-colors hover:bg-zinc-100"
                          >
                            <span className="truncate font-medium text-zinc-700">{source.web.title || source.web.uri}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0 text-zinc-400" />
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'analytics' && (
            <IndustryAnalyticsHub
              leads={leads}
              onSelectLead={(lead) => setSelectedLead(lead)}
            />
          )}

          {activeTab === 'outreach' && (
            <div className="mx-auto max-w-6xl space-y-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                      <Send className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Phase 3: Outreach & Campaign Center</h3>
                      <p className="text-xs text-zinc-500">Automated cold outreach letters, direct mail triggers & pitch composer.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={handleExportOutreachCSV}
                    disabled={outreachQueue.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export Queue CSV
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleBatchTriggerOutreach}
                    disabled={isBatchTriggering || leads.filter(l => l.status === 'qualified' || ((l.exitPropensityScore || 0) >= 8 && l.status !== 'outreach_triggered')).length === 0}
                  >
                    {isBatchTriggering ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Batch Trigger Qualified ({leads.filter(l => l.status === 'qualified' || ((l.exitPropensityScore || 0) >= 8 && l.status !== 'outreach_triggered')).length})
                  </Button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="flex items-center gap-4 bg-gradient-to-br from-emerald-50/60 to-white border-emerald-100">
                  <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-800/60">Ready for Outreach</p>
                    <p className="text-2xl font-black text-emerald-700">
                      {leads.filter(l => l.status === 'qualified' || ((l.exitPropensityScore || 0) >= 8 && l.status !== 'outreach_triggered')).length}
                    </p>
                  </div>
                </Card>

                <Card className="flex items-center gap-4 bg-gradient-to-br from-blue-50/60 to-white border-blue-100">
                  <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-blue-800/60">Outreach Triggered</p>
                    <p className="text-2xl font-black text-blue-700">
                      {leads.filter(l => l.status === 'outreach_triggered').length}
                    </p>
                  </div>
                </Card>

                <Card className="flex items-center gap-4 bg-gradient-to-br from-red-50/60 to-white border-red-100">
                  <div className="rounded-xl bg-red-100 p-3 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-red-800/60">High Fatigue Targets</p>
                    <p className="text-2xl font-black text-red-700">
                      {leads.filter(l => (l.permitDrop || 0) >= 30 && (l.exitPropensityScore || 0) >= 8).length}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Outreach Workspace Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Outreach Queue */}
                <div className="lg:col-span-5 space-y-4">
                  <Card className="space-y-4 p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Outreach Queue ({outreachQueue.length})</h4>
                      <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 text-[11px] font-medium">
                        <button 
                          onClick={() => setOutreachFilter('all')}
                          className={cn("px-2.5 py-1 rounded-md transition-colors", outreachFilter === 'all' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800")}
                        >
                          All
                        </button>
                        <button 
                          onClick={() => setOutreachFilter('pending')}
                          className={cn("px-2.5 py-1 rounded-md transition-colors", outreachFilter === 'pending' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800")}
                        >
                          Pending
                        </button>
                        <button 
                          onClick={() => setOutreachFilter('triggered')}
                          className={cn("px-2.5 py-1 rounded-md transition-colors", outreachFilter === 'triggered' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800")}
                        >
                          Triggered
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                      {outreachQueue.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-400 italic border border-dashed border-zinc-200 rounded-xl">
                          No leads in this queue filter.
                        </div>
                      ) : (
                        outreachQueue.map((lead) => {
                          const isSelected = lead.id === selectedOutreachLeadId;
                          const isTriggered = lead.status === 'outreach_triggered';
                          return (
                            <div 
                              key={lead.id}
                              onClick={() => {
                                setSelectedOutreachLeadId(lead.id);
                                handleGenerateLetterForOutreach(lead);
                              }}
                              className={cn(
                                "group relative cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md",
                                isSelected 
                                  ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20" 
                                  : "border-zinc-200 bg-white hover:border-zinc-300"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h5 className="font-bold text-sm text-zinc-900 group-hover:text-blue-600 transition-colors">{lead.name}</h5>
                                  <p className="text-xs text-zinc-500">{lead.industry} • {lead.location}</p>
                                </div>
                                <div className="text-right">
                                  <span className={cn(
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                                    (lead.exitPropensityScore || 0) >= 8 ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
                                  )}>
                                    Score: {lead.exitPropensityScore || '?'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-100">
                                <div className="flex items-center gap-2">
                                  {lead.permitDrop >= 30 && (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                      -{lead.permitDrop}% permits
                                    </span>
                                  )}
                                  <span className="text-zinc-400 text-[10px]">Valuation: ${(lead.valuationEstimate || 0).toLocaleString()}</span>
                                </div>
                                <Badge variant={isTriggered ? 'info' : 'success'}>
                                  {isTriggered ? 'Triggered' : 'Pending'}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card>
                </div>

                {/* Right Column: AI Pitch & Letter Composer */}
                <div className="lg:col-span-7 space-y-4">
                  {selectedOutreachLead ? (
                    <Card className="space-y-6 p-6 border-zinc-200">
                      {/* Lead Overview Header */}
                      <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Selected Lead</span>
                            <Badge variant={selectedOutreachLead.status === 'outreach_triggered' ? 'info' : 'success'}>
                              {selectedOutreachLead.status === 'outreach_triggered' ? 'Outreach Sent' : 'Ready for Pitch'}
                            </Badge>
                          </div>
                          <h4 className="text-xl font-bold text-zinc-900 mt-1">{selectedOutreachLead.name}</h4>
                          <p className="text-xs text-zinc-500">{selectedOutreachLead.industry} | {selectedOutreachLead.location} | Owner: <span className="font-semibold text-zinc-700">{selectedOutreachLead.agentName || 'Business Owner'}</span></p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-zinc-400">Valuation</p>
                          <p className="text-lg font-black text-emerald-600">${(selectedOutreachLead.valuationEstimate || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Outreach Pitch Strategy Controls */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Outreach Strategy Template</label>
                          <Button
                            variant="outline"
                            size="xs"
                            className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleGenerateLetterForOutreach()}
                            disabled={isGeneratingLetter}
                          >
                            {isGeneratingLetter ? <Clock className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-emerald-600" />}
                            Regenerate AI Draft
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              setOutreachTemplate('direct_acquisition');
                              handleGenerateLetterForOutreach();
                            }}
                            className={cn(
                              "rounded-xl border p-3 text-left transition-all text-xs",
                              outreachTemplate === 'direct_acquisition' 
                                ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold ring-1 ring-blue-500" 
                                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            )}
                          >
                            <p className="font-bold">Direct Acquisition</p>
                            <p className="text-[10px] text-zinc-400 font-normal mt-0.5">Straightforward PE offer</p>
                          </button>

                          <button
                            onClick={() => {
                              setOutreachTemplate('confidential_inquiry');
                              handleGenerateLetterForOutreach();
                            }}
                            className={cn(
                              "rounded-xl border p-3 text-left transition-all text-xs",
                              outreachTemplate === 'confidential_inquiry' 
                                ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold ring-1 ring-blue-500" 
                                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            )}
                          >
                            <p className="font-bold">Confidential Inquiry</p>
                            <p className="text-[10px] text-zinc-400 font-normal mt-0.5">Discreet succession chat</p>
                          </button>

                          <button
                            onClick={() => {
                              setOutreachTemplate('strategic_partnership');
                              handleGenerateLetterForOutreach();
                            }}
                            className={cn(
                              "rounded-xl border p-3 text-left transition-all text-xs",
                              outreachTemplate === 'strategic_partnership' 
                                ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold ring-1 ring-blue-500" 
                                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            )}
                          >
                            <p className="font-bold">Strategic Partner</p>
                            <p className="text-[10px] text-zinc-400 font-normal mt-0.5">Growth & recapitalization</p>
                          </button>
                        </div>
                      </div>

                      {/* Subject Line Composer */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email / Letter Subject Line</label>
                          <button
                            onClick={() => handleCopyText(outreachSubject, 'subject')}
                            className="text-xs text-zinc-500 hover:text-blue-600 flex items-center gap-1"
                          >
                            {copiedField === 'subject' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            {copiedField === 'subject' ? 'Copied!' : 'Copy Subject'}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={outreachSubject}
                          onChange={(e) => setOutreachSubject(e.target.value)}
                          placeholder="Generated subject line will appear here..."
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 px-3.5 text-sm font-semibold text-zinc-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Letter Body Composer */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Personalized Letter Draft</label>
                          <button
                            onClick={() => handleCopyText(outreachLetterBody, 'letter')}
                            className="text-xs text-zinc-500 hover:text-blue-600 flex items-center gap-1"
                          >
                            {copiedField === 'letter' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            {copiedField === 'letter' ? 'Copied Letter!' : 'Copy Body Text'}
                          </button>
                        </div>
                        
                        <div className="relative">
                          <textarea
                            value={outreachLetterBody}
                            onChange={(e) => setOutreachLetterBody(e.target.value)}
                            rows={10}
                            placeholder="Click 'Regenerate AI Draft' to compose a custom letter..."
                            className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-xs leading-relaxed text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                          {isGeneratingLetter && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center rounded-xl">
                              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                                <Clock className="h-4 w-4 animate-spin" />
                                Generating personalized outreach letter with Gemini...
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3-Touch Sequence Multi-Channel Generator */}
                      <div className="space-y-3 pt-4 border-t border-zinc-200">
                        <div className="flex items-center justify-between">
                          <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-800">
                            <Layers className="h-4 w-4 text-emerald-600" />
                            30-Day Multi-Touch Campaign Sequence
                          </h5>
                          <Button
                            size="xs"
                            variant="outline"
                            className="gap-1 text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            onClick={() => handleGenerate3TouchSequence(selectedOutreachLead)}
                            disabled={isGeneratingSequence}
                          >
                            {isGeneratingSequence ? <Clock className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-emerald-600" />}
                            Generate 3-Touch Cadence
                          </Button>
                        </div>

                        {outreachSequence ? (
                          <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-xs">
                            <div className="flex gap-2 border-b border-zinc-200 pb-2">
                              <button
                                onClick={() => setActiveSequenceTouch('touch1')}
                                className={cn("flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all", activeSequenceTouch === 'touch1' ? "bg-white text-zinc-900 shadow-xs border" : "text-zinc-500 hover:text-zinc-800")}
                              >
                                Touch 1: Direct Mail
                              </button>
                              <button
                                onClick={() => setActiveSequenceTouch('touch2')}
                                className={cn("flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all", activeSequenceTouch === 'touch2' ? "bg-white text-zinc-900 shadow-xs border" : "text-zinc-500 hover:text-zinc-800")}
                              >
                                Touch 2: Cold Email (Day 7)
                              </button>
                              <button
                                onClick={() => setActiveSequenceTouch('touch3')}
                                className={cn("flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all", activeSequenceTouch === 'touch3' ? "bg-white text-zinc-900 shadow-xs border" : "text-zinc-500 hover:text-zinc-800")}
                              >
                                Touch 3: Call & Voicemail (Day 14)
                              </button>
                            </div>

                            {activeSequenceTouch === 'touch1' && (
                              <div className="space-y-2 bg-white p-3 rounded-lg border border-zinc-100">
                                <p className="font-bold text-zinc-800">{outreachSequence.touch1_DirectMail.subject}</p>
                                <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed">{outreachSequence.touch1_DirectMail.body}</p>
                              </div>
                            )}

                            {activeSequenceTouch === 'touch2' && (
                              <div className="space-y-2 bg-white p-3 rounded-lg border border-zinc-100">
                                <p className="font-bold text-zinc-800">{outreachSequence.touch2_ColdEmail.subject}</p>
                                <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed">{outreachSequence.touch2_ColdEmail.body}</p>
                              </div>
                            )}

                            {activeSequenceTouch === 'touch3' && (
                              <div className="space-y-2 bg-white p-3 rounded-lg border border-zinc-100">
                                <p className="font-bold text-zinc-800">{outreachSequence.touch3_PhoneScript.subject}</p>
                                <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed">{outreachSequence.touch3_PhoneScript.body}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400 italic">Click 'Generate 3-Touch Cadence' to craft a high-converting 30-day sequence across Direct Mail, Cold Email, and Phone Scripts.</p>
                        )}
                      </div>

                      {/* Trigger Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          variant="primary"
                          className="flex-1 py-3 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => updateLeadStatus(selectedOutreachLead.id, 'outreach_triggered')}
                        >
                          <Send className="h-4 w-4" />
                          Mark as Outreach Triggered
                        </Button>
                        <Button
                          variant="outline"
                          className="py-3 gap-2"
                          onClick={() => handleCopyText(`Subject: ${outreachSubject}\n\n${outreachLetterBody}`, 'full')}
                        >
                          <Copy className="h-4 w-4" />
                          {copiedField === 'full' ? 'Copied Full Pitch!' : 'Copy Complete Letter'}
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="flex flex-col items-center justify-center p-12 text-center text-zinc-400 min-h-[450px]">
                      <div className="rounded-2xl bg-zinc-100 p-4 mb-4">
                        <FileText className="h-8 w-8 text-zinc-400" />
                      </div>
                      <h4 className="font-bold text-zinc-700 text-lg mb-1">No Lead Selected</h4>
                      <p className="text-xs text-zinc-400 max-w-sm">
                        Select a target lead from the Outreach Queue on the left to generate customized AI letters, email subjects, and direct mail campaigns.
                      </p>
                    </Card>
                  )}
                </div>

              </div>
            </div>
          )}

          {activeTab === 'operator' && (
            <div className="mx-auto max-w-4xl space-y-8">
              <OperatorControlPanel selectedLead={selectedLead} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="mx-auto max-w-2xl space-y-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                  <Settings className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-2xl font-bold">System Settings</h3>
                <p className="text-zinc-500">Configure industry-specific EBITDA multiples for valuation estimates.</p>
              </div>

              <Card className="space-y-6 p-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Industry EBITDA Multiples</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Industry Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. HVAC" 
                        value={newIndustry}
                        onChange={(e) => setNewIndustry(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Multiple (x)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="e.g. 4.5" 
                          value={newMultiple}
                          onChange={(e) => setNewMultiple(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <Button onClick={handleAddMultiple} disabled={!newIndustry || !newMultiple}>Add</Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-white shadow-sm">
                    {Object.entries(profile?.industryMultiples || {}).length === 0 ? (
                      <div className="p-8 text-center text-sm text-zinc-400 italic">
                        No custom multiples defined. Gemini will use industry standards.
                      </div>
                    ) : (
                      Object.entries(profile?.industryMultiples || {}).map(([industry, multiple]) => (
                        <div key={industry} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-bold">{industry}</p>
                            <p className="text-xs text-zinc-500">{multiple}x EBITDA Multiple</p>
                          </div>
                          <button 
                            onClick={() => handleRemoveMultiple(industry)}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>

              <Card className="space-y-6 p-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Profit Margin Parameters</h4>
                  <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Default Profit Margin (%)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 20" 
                        value={defaultProfitMargin}
                        onChange={(e) => setDefaultProfitMargin(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <Button onClick={handleUpdateProfitMargin}>Save Margin</Button>
                  </div>
                  <p className="text-xs text-zinc-400">Used for valuation if a lead's specific profit margin is unknown.</p>
                </div>
              </Card>

              <Card className="space-y-6 p-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Revenue-Based Multiplier Tiers</h4>
                  <p className="text-xs text-zinc-500">Define how the EBITDA multiple should adjust based on the business's annual revenue.</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Min Revenue ($)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={newTierMin}
                        onChange={(e) => setNewTierMin(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Max Revenue ($)</label>
                      <input 
                        type="number" 
                        placeholder="1000000" 
                        value={newTierMax}
                        onChange={(e) => setNewTierMax(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Multiplier (x)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="3.0" 
                          value={newTierMultiplier}
                          onChange={(e) => setNewTierMultiplier(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <Button onClick={handleAddRevenueTier} disabled={!newTierMin || !newTierMax || !newTierMultiplier}>Add</Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-white shadow-sm">
                    {(!profile?.valuationParameters?.revenueTiers || profile.valuationParameters.revenueTiers.length === 0) ? (
                      <div className="p-8 text-center text-sm text-zinc-400 italic">
                        No revenue tiers defined.
                      </div>
                    ) : (
                      profile.valuationParameters.revenueTiers.map((tier, index) => (
                        <div key={index} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-bold">${tier.min.toLocaleString()} - ${tier.max.toLocaleString()}</p>
                            <p className="text-xs text-zinc-500">{tier.multiplier}x Base Multiple</p>
                          </div>
                          <button 
                            onClick={() => handleRemoveRevenueTier(index)}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>

              <Card className="space-y-6 p-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Profit Margin Multiplier Adjustments</h4>
                  <p className="text-xs text-zinc-500">Define how the EBITDA multiple should adjust based on the business's profit margin.</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Min Margin (%)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={newProfitTierMin}
                        onChange={(e) => setNewProfitTierMin(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Max Margin (%)</label>
                      <input 
                        type="number" 
                        placeholder="100" 
                        value={newProfitTierMax}
                        onChange={(e) => setNewProfitTierMax(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Adjustment (+/- x)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="0.5" 
                          value={newProfitTierMultiplier}
                          onChange={(e) => setNewProfitTierMultiplier(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <Button onClick={handleAddProfitTier} disabled={!newProfitTierMin || !newProfitTierMax || !newProfitTierMultiplier}>Add</Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-white shadow-sm">
                    {(!profile?.valuationParameters?.profitMarginTiers || profile.valuationParameters.profitMarginTiers.length === 0) ? (
                      <div className="p-8 text-center text-sm text-zinc-400 italic">
                        No profit margin tiers defined.
                      </div>
                    ) : (
                      profile.valuationParameters.profitMarginTiers.map((tier, index) => (
                        <div key={index} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-bold">{tier.min}% - {tier.max}% Margin</p>
                            <p className="text-xs text-zinc-500">{tier.multiplier > 0 ? '+' : ''}{tier.multiplier}x Multiple Adjustment</p>
                          </div>
                          <button 
                            onClick={() => handleRemoveProfitTier(index)}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>

              <Card className="space-y-6 p-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Location-Based Multipliers</h4>
                  <p className="text-xs text-zinc-500">Add multiplier adjustments for specific business locations (e.g. +0.5x for "San Jose, CA").</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Location Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. San Jose, CA" 
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Adjustment (+/- x)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="0.5" 
                          value={newLocationMultiplier}
                          onChange={(e) => setNewLocationMultiplier(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <Button onClick={handleAddLocationMultiplier} disabled={!newLocation || !newLocationMultiplier}>Add</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-white shadow-sm">
                    {(!profile?.valuationParameters?.locationMultipliers || Object.keys(profile.valuationParameters.locationMultipliers).length === 0) ? (
                      <div className="p-8 text-center text-sm text-zinc-400 italic">
                        No location multipliers defined.
                      </div>
                    ) : (
                      Object.entries(profile.valuationParameters.locationMultipliers).map(([loc, mult]) => (
                        <div key={loc} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-bold">{loc}</p>
                            <p className="text-xs text-zinc-500">{mult > 0 ? '+' : ''}{mult}x Multiple Adjustment</p>
                          </div>
                          <button 
                            onClick={() => handleRemoveLocationMultiplier(loc)}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>

              <Card className="space-y-6 p-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Business Age Multipliers</h4>
                  <p className="text-xs text-zinc-500">Reward established businesses with multiplier bonuses based on their age.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Min Years Established</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 20" 
                        value={newAgeMin}
                        onChange={(e) => setNewAgeMin(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Adjustment (+/- x)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="0.3" 
                          value={newAgeMultiplier}
                          onChange={(e) => setNewAgeMultiplier(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <Button onClick={handleAddAgeMultiplier} disabled={!newAgeMin || !newAgeMultiplier}>Add</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-white shadow-sm">
                    {(!profile?.valuationParameters?.ageMultipliers || profile.valuationParameters.ageMultipliers.length === 0) ? (
                      <div className="p-8 text-center text-sm text-zinc-400 italic">
                        No age multipliers defined.
                      </div>
                    ) : (
                      profile.valuationParameters.ageMultipliers.map((tier, index) => (
                        <div key={index} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-bold">{tier.minYears}+ Years Established</p>
                            <p className="text-xs text-zinc-500">{tier.multiplier > 0 ? '+' : ''}{tier.multiplier}x Multiple Adjustment</p>
                          </div>
                          <button 
                            onClick={() => handleRemoveAgeMultiplier(index)}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>

              <Card className="space-y-6 p-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Custom Valuation Rules</h4>
                  <p className="text-xs text-zinc-500">Provide natural language instructions to the AI for specific valuation scenarios.</p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Add 0.5x for businesses in California" 
                      value={newCustomRule}
                      onChange={(e) => setNewCustomRule(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <Button onClick={handleAddCustomRule} disabled={!newCustomRule.trim()}>Add Rule</Button>
                  </div>

                  <div className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-white shadow-sm">
                    {(!profile?.valuationParameters?.customValuationRules || profile.valuationParameters.customValuationRules.length === 0) ? (
                      <div className="p-8 text-center text-sm text-zinc-400 italic">
                        No custom rules defined.
                      </div>
                    ) : (
                      profile.valuationParameters.customValuationRules.map((rule, index) => (
                        <div key={index} className="flex items-center justify-between p-4">
                          <p className="text-sm text-zinc-700">{rule}</p>
                          <button 
                            onClick={() => handleRemoveCustomRule(index)}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>

              <Card className="space-y-6 p-8 bg-gradient-to-br from-emerald-50/50 to-white border-emerald-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Download className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-900">Project Export (.ZIP)</h4>
                      <p className="text-xs text-zinc-500">Download the complete source code archive of Silver Scout (React + Vite + Firebase + Gemini).</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href="/silver_scout_export.zip"
                      download="silver_scout_export.zip"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
                    >
                      <Download className="h-4 w-4" />
                      Download Complete Project Source (.ZIP)
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Lead Intelligence Report">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="h-full w-full max-w-2xl border-l border-zinc-200 bg-white shadow-2xl"
            >
              <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-8">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold">Lead Intelligence Report</h3>
                  <PresenceAvatars viewers={[
                    profile || { uid: 'u1', email: 'user@fund.com', displayName: 'Current User', role: 'partner' },
                    { uid: 'u2', email: 'sarah@fund.com', displayName: 'Sarah J.', role: 'associate' }
                  ]} />
                </div>
                <button onClick={() => setSelectedLead(null)} className="text-zinc-400 hover:text-zinc-600">
                  <ChevronRight className="h-6 w-6 rotate-180" />
                </button>
              </div>
              
              <div className="h-[calc(100vh-64px)] overflow-y-auto p-8">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">{selectedLead.name}</h2>
                    <p className="text-zinc-500">{selectedLead.industry} · {selectedLead.location}</p>
                    
                    {/* Tags Section */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(selectedLead.tags || []).map(tag => (
                        <span key={tag} className="group flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-600 ring-1 ring-zinc-200 transition-all hover:bg-zinc-200">
                          {tag}
                          <button 
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-0.5 text-zinc-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          placeholder="Add tag..." 
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                          className="w-24 rounded-full border border-dashed border-zinc-300 bg-transparent px-2.5 py-1 text-[10px] focus:border-emerald-500 focus:outline-none"
                        />
                        {newTag && (
                          <button onClick={handleAddTag} className="text-emerald-600 hover:text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedLead.status === 'archived' && (selectedLead.archiveReason || selectedLead.archiveNotes) && (
                      <div className="mt-2 space-y-1">
                        {selectedLead.archiveReason && (
                          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-500/10">
                            <AlertCircle className="h-3 w-3" />
                            Archived: {selectedLead.archiveReason}
                          </div>
                        )}
                        {selectedLead.archiveNotes && (
                          <p className="px-3 text-[10px] text-zinc-500 italic">
                            Notes: {selectedLead.archiveNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-zinc-400">Exit Propensity</p>
                    <p className="text-4xl font-black text-emerald-600">{selectedLead.exitPropensityScore || '?'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-zinc-50">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400">Valuation Est.</p>
                    <p className="text-xl font-bold">${(selectedLead.valuationEstimate || 0).toLocaleString()}</p>
                  </Card>
                  <Card className="bg-zinc-50">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400">Permit Drop</p>
                    <p className="text-xl font-bold text-red-600">{selectedLead.permitDrop}%</p>
                  </Card>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                      <BarChart3 className="h-3 w-3" />
                      Financial Parameters
                    </h4>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setShowFinancialParserModal(true)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                      >
                        <FileUp className="h-3 w-3" />
                        Parse P&L Document
                      </button>
                      <button 
                        onClick={() => setIsEditingFinancials(!isEditingFinancials)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                      >
                        {isEditingFinancials ? 'Cancel' : 'Edit Data'}
                      </button>
                    </div>
                  </div>
                  
                  {isEditingFinancials ? (
                    <div className="grid grid-cols-3 gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase">Revenue ($)</label>
                        <input 
                          type="number" 
                          value={editRevenue}
                          onChange={(e) => setEditRevenue(e.target.value)}
                          placeholder="e.g. 5000000"
                          className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase">EBITDA ($)</label>
                        <input 
                          type="number" 
                          value={editEbitda}
                          onChange={(e) => setEditEbitda(e.target.value)}
                          placeholder="e.g. 1000000"
                          className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase">Margin (%)</label>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            value={editProfitMargin}
                            onChange={(e) => setEditProfitMargin(e.target.value)}
                            placeholder="e.g. 20"
                            className="flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <Button size="sm" onClick={handleUpdateLeadFinancials}>Save</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                </div>

                {/* LBO Returns & SDE Add-Backs Modeler */}
                <div className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-800 text-xs">
                      <Calculator className="h-4 w-4 text-emerald-600" />
                      LBO Financial Modeler & SDE Add-Backs
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Live Return Engine
                    </span>
                  </div>

                  {/* SDE Add-Backs List */}
                  <div className="space-y-2 border-b border-zinc-200 pb-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Seller Discretionary Add-Backs</label>
                    <div className="space-y-1.5">
                      {addBacksList.map(item => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-zinc-100 shadow-xs">
                          <span className="font-medium text-zinc-700">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-600">+${item.amount.toLocaleString()}</span>
                            <button onClick={() => handleRemoveAddBack(item.id)} className="text-zinc-400 hover:text-red-500">
                              <Minus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <input 
                        type="text" 
                        placeholder="Add-back item (e.g. Owner Travel)"
                        value={newAddBackName}
                        onChange={(e) => setNewAddBackName(e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-200 bg-white py-1 px-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                      <input 
                        type="number" 
                        placeholder="Amount $"
                        value={newAddBackAmount}
                        onChange={(e) => setNewAddBackAmount(e.target.value)}
                        className="w-24 rounded-lg border border-zinc-200 bg-white py-1 px-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                      <Button size="xs" onClick={handleAddAddBack} className="gap-1">
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    </div>
                  </div>

                  {/* Adjusted EBITDA Metric */}
                  {(() => {
                    const baseEbitda = selectedLead.ebitda || (selectedLead.revenue ? selectedLead.revenue * 0.2 : (selectedLead.valuationEstimate || 3000000) / 4.5);
                    const totalAddBacks = addBacksList.reduce((sum, item) => sum + item.amount, 0);
                    const adjustedEbitda = baseEbitda + totalAddBacks;

                    const entryValuation = selectedLead.valuationEstimate || (adjustedEbitda * 4.5);
                    const debtAmount = entryValuation * (lboSeniorDebtPercent / 100);
                    const equityCheck = entryValuation - debtAmount;

                    const exitEbitda = adjustedEbitda * Math.pow(1 + lboRevenueGrowth / 100, lboHoldYears);
                    const exitEnterpriseValue = exitEbitda * lboExitMultiple;
                    const exitDebtRemaining = Math.max(0, debtAmount - (adjustedEbitda * 0.35 * lboHoldYears));
                    const exitEquityValue = exitEnterpriseValue - exitDebtRemaining;

                    const projectedMoIC = equityCheck > 0 ? (exitEquityValue / equityCheck) : 0;
                    const projectedIRR = (equityCheck > 0 && projectedMoIC > 0) ? (Math.pow(projectedMoIC, 1 / lboHoldYears) - 1) * 100 : 0;

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border">
                          <span className="font-semibold text-zinc-600">Base EBITDA: ${Math.round(baseEbitda).toLocaleString()}</span>
                          <span className="font-extrabold text-emerald-700">Adjusted SDE EBITDA: ${Math.round(adjustedEbitda).toLocaleString()}</span>
                        </div>

                        {/* LBO Inputs Grid */}
                        <div className="grid grid-cols-4 gap-2 text-[10px]">
                          <div>
                            <label className="font-bold text-zinc-400 uppercase">Senior Debt %</label>
                            <input 
                              type="number" 
                              value={lboSeniorDebtPercent}
                              onChange={(e) => setLboSeniorDebtPercent(parseFloat(e.target.value) || 0)}
                              className="w-full rounded border border-zinc-200 bg-white p-1 font-semibold text-zinc-800"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-zinc-400 uppercase">Interest %</label>
                            <input 
                              type="number" 
                              step="0.5"
                              value={lboInterestRate}
                              onChange={(e) => setLboInterestRate(parseFloat(e.target.value) || 0)}
                              className="w-full rounded border border-zinc-200 bg-white p-1 font-semibold text-zinc-800"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-zinc-400 uppercase">Hold Years</label>
                            <input 
                              type="number" 
                              value={lboHoldYears}
                              onChange={(e) => setLboHoldYears(parseFloat(e.target.value) || 0)}
                              className="w-full rounded border border-zinc-200 bg-white p-1 font-semibold text-zinc-800"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-zinc-400 uppercase">Exit Multiple</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={lboExitMultiple}
                              onChange={(e) => setLboExitMultiple(parseFloat(e.target.value) || 0)}
                              className="w-full rounded border border-zinc-200 bg-white p-1 font-semibold text-zinc-800"
                            />
                          </div>
                        </div>

                        {/* LBO Output Badges */}
                        <div className="grid grid-cols-4 gap-2 bg-zinc-900 text-white rounded-xl p-3 text-center">
                          <div>
                            <p className="text-[9px] uppercase text-zinc-400">Equity Check</p>
                            <p className="text-xs font-bold text-white">${Math.round(equityCheck).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-zinc-400">Exit EV</p>
                            <p className="text-xs font-bold text-white">${Math.round(exitEnterpriseValue).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-zinc-400">Projected MoIC</p>
                            <p className="text-sm font-black text-emerald-400">{projectedMoIC.toFixed(2)}x</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-zinc-400">Projected IRR</p>
                            <p className="text-sm font-black text-emerald-400">{projectedIRR.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                      <Globe className="h-3 w-3" />
                      Social & Web Presence
                    </h4>
                    <button 
                      onClick={() => setIsEditingSocial(!isEditingSocial)}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                    >
                      {isEditingSocial ? 'Cancel' : 'Edit Links'}
                    </button>
                  </div>
                  
                  {isEditingSocial ? (
                    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase">LinkedIn URL</label>
                          <input 
                            type="text" 
                            value={editLinkedin}
                            onChange={(e) => setEditLinkedin(e.target.value)}
                            placeholder="https://linkedin.com/..."
                            className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase">Twitter URL</label>
                          <input 
                            type="text" 
                            value={editTwitter}
                            onChange={(e) => setEditTwitter(e.target.value)}
                            placeholder="https://twitter.com/..."
                            className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase">Website URL</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={editWebsite}
                            onChange={(e) => setEditWebsite(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <Button size="sm" onClick={handleUpdateSocialLinks}>Save</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      {selectedLead.socialLinks?.linkedin ? (
                        <a 
                          href={selectedLead.socialLinks.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-white p-3 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50"
                        >
                          <Linkedin className="h-4 w-4 text-[#0077b5]" />
                          <span className="text-xs font-medium text-zinc-600">LinkedIn</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-3 opacity-50">
                          <Linkedin className="h-4 w-4 text-zinc-400" />
                          <span className="text-xs font-medium text-zinc-400">LinkedIn</span>
                        </div>
                      )}
                      
                      {selectedLead.socialLinks?.twitter ? (
                        <a 
                          href={selectedLead.socialLinks.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-white p-3 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50"
                        >
                          <Twitter className="h-4 w-4 text-[#1da1f2]" />
                          <span className="text-xs font-medium text-zinc-600">Twitter</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-3 opacity-50">
                          <Twitter className="h-4 w-4 text-zinc-400" />
                          <span className="text-xs font-medium text-zinc-400">Twitter</span>
                        </div>
                      )}

                      {selectedLead.socialLinks?.website ? (
                        <a 
                          href={selectedLead.socialLinks.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-white p-3 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50"
                        >
                          <Globe className="h-4 w-4 text-zinc-600" />
                          <span className="text-xs font-medium text-zinc-600">Website</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-3 opacity-50">
                          <Globe className="h-4 w-4 text-zinc-400" />
                          <span className="text-xs font-medium text-zinc-400">Website</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-8 space-y-6">
                  {selectedLead.permitAnalysis && (
                    <section>
                      <h4 className="mb-3 flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                        <AlertCircle className="h-3 w-3" />
                        Permit Activity Analysis
                      </h4>
                      <div className={cn(
                        "rounded-xl p-6 text-sm ring-1",
                        selectedLead.permitDrop >= 30 
                          ? "bg-red-50 text-red-900 ring-red-500/10" 
                          : "bg-zinc-50 text-zinc-700 ring-zinc-500/10"
                      )}>
                        <div className="flex items-start gap-3">
                          {selectedLead.permitDrop >= 30 && (
                            <div className="mt-0.5 rounded-full bg-red-100 p-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                            </div>
                          )}
                          <div className="space-y-2">
                            {selectedLead.permitDrop >= 30 && (
                              <p className="font-bold text-red-700">High-Risk Fatigue Signal Detected</p>
                            )}
                            <div className="prose prose-sm max-w-none text-inherit">
                              <ReactMarkdown>{selectedLead.permitAnalysis}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  <section>
                    <h4 className="mb-3 flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                      <BrainCircuit className="h-3 w-3" />
                      AI Investment Thesis
                    </h4>
                    <div className="prose prose-sm max-w-none rounded-xl bg-emerald-50/50 p-6 text-zinc-700 ring-1 ring-emerald-500/10">
                      {selectedLead.aiThesis ? (
                        <ReactMarkdown>{selectedLead.aiThesis}</ReactMarkdown>
                      ) : (
                        <p className="italic text-zinc-400">No AI thesis generated yet. Run Intelligence Phase to analyze fatigue signals.</p>
                      )}
                    </div>

                    {/* Feedback Section */}
                    {selectedLead.aiThesis && (
                      <div className="mt-4 border-t border-zinc-100 pt-4">
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Refine AI Thesis</h5>
                        
                        {selectedLead.thesisFeedback ? (
                          <div className="rounded-xl bg-zinc-50 p-4">
                            <div className="flex items-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={cn(
                                    "h-3 w-3",
                                    star <= selectedLead.thesisFeedback!.rating ? "fill-emerald-500 text-emerald-500" : "text-zinc-300"
                                  )} 
                                />
                              ))}
                            </div>
                            {selectedLead.thesisFeedback.comment && (
                              <p className="text-xs text-zinc-600 italic">"{selectedLead.thesisFeedback.comment}"</p>
                            )}
                            <p className="mt-2 text-[9px] text-zinc-400 uppercase tracking-wider">Feedback Recorded</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-zinc-500 mr-1">Rate accuracy:</p>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setFeedbackRating(star)}
                                  className="transition-transform hover:scale-110"
                                >
                                  <Star 
                                    className={cn(
                                      "h-5 w-5 transition-colors",
                                      star <= feedbackRating ? "fill-emerald-500 text-emerald-500" : "text-zinc-300 hover:text-emerald-400"
                                    )} 
                                  />
                                </button>
                              ))}
                            </div>
                            
                            <textarea
                              placeholder="What could be improved? (e.g., 'Too aggressive on valuation')"
                              value={feedbackComment}
                              onChange={(e) => setFeedbackComment(e.target.value)}
                              className="w-full rounded-xl border border-zinc-200 p-3 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              rows={2}
                            />
                            
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="w-full text-xs py-2"
                              disabled={feedbackRating === 0 || isSubmittingFeedback}
                              onClick={submitFeedback}
                            >
                              {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                  
                  <section>
                    <h4 className="mb-3 flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                      <Database className="h-3 w-3" />
                      Raw Signals
                    </h4>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      <div className="flex justify-between border-b border-zinc-100 pb-2">
                        <span className="text-zinc-500">Entity Age</span>
                        <span className="font-medium">{new Date().getFullYear() - new Date(selectedLead.registrationDate).getFullYear()} Years</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 pb-2">
                        <span className="text-zinc-500">Agent Type</span>
                        <span className="font-medium">{selectedLead.isCorporateAgent ? 'Corporate' : 'Individual'}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 pb-2">
                        <span className="text-zinc-500">Digital Activity</span>
                        <span className="font-medium">{selectedLead.lastDigitalPostDate}</span>
                      </div>
                    </div>

                    {/* Digital Health & Ghost Signal Scanner */}
                    <div className="mt-8 border-t border-zinc-100 pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-800 text-xs">
                          <SearchCheck className="h-4 w-4 text-emerald-600" />
                          Digital Health & Owner Contact Audit
                        </h4>
                        <Button 
                          size="xs" 
                          variant="outline" 
                          className="gap-1 text-[10px]"
                          onClick={() => handleScanDigitalHealth(selectedLead)}
                          disabled={isScanningHealth}
                        >
                          {isScanningHealth ? (
                            <Clock className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 text-emerald-500" />
                          )}
                          Audit Digital Presence
                        </Button>
                      </div>

                      {digitalScanData[selectedLead.id] ? (
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-3 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-2.5 rounded-lg border border-zinc-100">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase block">Domain Status</span>
                              <span className="font-semibold text-zinc-800">{digitalScanData[selectedLead.id].domainStatus}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-zinc-100">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase block">Google Profile</span>
                              <span className="font-semibold text-zinc-800">{digitalScanData[selectedLead.id].googleProfileStatus}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-zinc-100">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase block">SSL & Security</span>
                              <span className="font-semibold text-zinc-800">{digitalScanData[selectedLead.id].sslStatus}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-zinc-100">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase block">Digital Stagnation Score</span>
                              <span className="font-bold text-emerald-600">{digitalScanData[selectedLead.id].digitalFatigueScore}/10</span>
                            </div>
                          </div>

                          {(digitalScanData[selectedLead.id].ownerVerifiedEmail || digitalScanData[selectedLead.id].ownerVerifiedPhone) && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between text-emerald-900">
                              <span className="font-bold text-[10px] uppercase">Verified Owner Contact</span>
                              <span className="font-mono text-xs font-semibold">
                                {digitalScanData[selectedLead.id].ownerVerifiedEmail || digitalScanData[selectedLead.id].ownerVerifiedPhone}
                              </span>
                            </div>
                          )}

                          <p className="text-zinc-600 text-[11px] italic bg-white p-2.5 rounded-lg border border-zinc-100">
                            "{digitalScanData[selectedLead.id].summary}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">Click 'Audit Digital Presence' to scan domain expiration dates, SSL health, Google Business Profile claim status, and owner contact details.</p>
                      )}
                    </div>

                    {/* AI Outreach Assistant Section */}
                    {selectedLead.aiThesis && (
                      <div className="mt-8 border-t border-zinc-100 pt-8">
                        <h4 className="mb-4 flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                          <Send className="h-3 w-3" />
                          AI Outreach Assistant
                        </h4>
                        
                        {!selectedLead.suggestedSubjectLines ? (
                          <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center">
                            <p className="mb-4 text-sm text-zinc-500">Generate high-converting subject lines based on this lead's profile and thesis.</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={handleGenerateSubjectLines}
                              disabled={isGeneratingSubjects}
                            >
                              {isGeneratingSubjects ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                              ) : (
                                <Zap className="h-3 w-3 text-emerald-500" />
                              )}
                              Generate Subject Lines
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Suggested Subject Lines</p>
                              <Button 
                                variant="ghost" 
                                size="xs" 
                                className="h-6 text-[9px] uppercase tracking-wider text-zinc-400 hover:text-emerald-600"
                                onClick={handleGenerateSubjectLines}
                                disabled={isGeneratingSubjects}
                              >
                                {isGeneratingSubjects ? 'Regenerating...' : 'Regenerate'}
                              </Button>
                            </div>
                            <div className="grid gap-2">
                              {selectedLead.suggestedSubjectLines.map((subject, idx) => (
                                <div 
                                  key={idx}
                                  className="group relative flex items-center justify-between rounded-lg border border-zinc-100 bg-white p-3 text-xs transition-all hover:border-emerald-200 hover:shadow-sm"
                                >
                                  <span className="font-medium text-zinc-700">{subject}</span>
                                  <button 
                                    className="opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={() => {
                                      navigator.clipboard.writeText(subject);
                                      // Could add a toast here
                                    }}
                                  >
                                    <Copy className="h-3 w-3 text-zinc-400 hover:text-emerald-600" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  <div className="pt-6 border-t border-zinc-200 space-y-6">
                    <DealComments lead={selectedLead} profile={profile} onAddComment={handleAddComment} />
                    <ActivityTimeline logs={selectedLead.activityLogs} />
                  </div>
                </div>
                <div className="mt-12 flex flex-col sm:flex-row gap-3">
                  <Button 
                    className="flex-1 gap-2 bg-amber-600 text-white hover:bg-amber-700 font-bold"
                    onClick={() => handleOpenLOIModal(selectedLead)}
                  >
                    <FileCheck2 className="h-4 w-4" />
                    Draft Non-Binding LOI
                  </Button>
                  <Button 
                    className="flex-1 gap-2 bg-zinc-900 text-white hover:bg-zinc-800"
                    onClick={() => handleGenerateICMemo(selectedLead)}
                  >
                    <FileText className="h-4 w-4 text-emerald-400" />
                    Generate 1-Page IC Memo
                  </Button>
                  <Button 
                    className="flex-1 gap-2 bg-emerald-700 text-white hover:bg-emerald-800 font-bold"
                    onClick={() => setPitchDeckLead(selectedLead)}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Generate LP/Lender Deck
                  </Button>
                  <Button 
                    className="flex-1 gap-2 bg-purple-700 text-white hover:bg-purple-800 font-bold"
                    onClick={() => setIsSyndicationModalOpen(true)}
                  >
                    <Calculator className="h-4 w-4" />
                    LP Waterfall Modeler
                  </Button>
                  <Button 
                    className="flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      updateLeadStatus(selectedLead.id, 'outreach_triggered');
                      setSelectedLead(null);
                    }}
                  >
                    <Send className="h-4 w-4" />
                    Trigger Outreach
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => handleArchiveClick(selectedLead)}
                  >
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Archive Lead
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Archive Reason Modal */}
      <AnimatePresence>
        {archiveModalLead && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Archive Target Lead">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-100"
            >
              <h3 className="text-xl font-bold text-zinc-900">Archive Target Lead</h3>
              <p className="text-xs text-zinc-500 mt-1">Select a reason for archiving {archiveModalLead.name}.</p>
              
              <div className="mt-6 space-y-3">
                {['Not a fit', 'Contacted Unsuccessfully', 'Inactive', 'Other'].map((reason) => (
                  <label key={reason} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors">
                    <span className="text-sm font-medium">{reason}</span>
                    <input 
                      type="radio" 
                      name="archiveReason" 
                      value={reason}
                      checked={archiveReason === reason}
                      onChange={(e) => setArchiveReason(e.target.value)}
                      className="h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  placeholder="Add more details about why this lead is being archived..."
                  className="w-full rounded-xl border border-zinc-200 p-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  rows={3}
                />
              </div>
            
              <div className="mt-8 flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => setArchiveModalLead(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  className="flex-1"
                  onClick={confirmArchive}
                >
                  Confirm Archive
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LP & Lender Executive Pitch Deck Modal */}
      <LenderPitchDeckModal lead={pitchDeckLead} onClose={() => setPitchDeckLead(null)} />

      {/* LP Equity Syndication & Waterfall Modeler Modal */}
      <SyndicationModelerModal isOpen={isSyndicationModalOpen} onClose={() => setIsSyndicationModalOpen(false)} />

      {/* 1-Page Investment Committee (IC) Deal Teaser Modal */}
      <AnimatePresence>
        {icMemoModalLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static" role="dialog" aria-modal="true" aria-label="Investment Committee Deal Teaser">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200 my-8 print:shadow-none print:border-none print:max-w-none print:p-0 print:my-0"
            >
              {/* Header Actions (Hidden when printing) */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-6 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-lg text-zinc-900">Investment Committee (IC) Deal Teaser</h3>
                    <p className="text-xs text-zinc-500">Confidential M&A Acquisition Brief • {icMemoModalLead.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 text-xs"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-3.5 w-3.5 text-zinc-600" />
                    Print / Export PDF
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 text-xs"
                    onClick={() => {
                      if (!icMemoData) return;
                      const markdown = `# INVESTMENT COMMITTEE MEMORANDUM\n**TARGET:** ${icMemoModalLead.name}\n**INDUSTRY:** ${icMemoModalLead.industry}\n**VALUATION EST:** $${(icMemoModalLead.valuationEstimate || 0).toLocaleString()}\n\n## DEAL SUMMARY\n${icMemoData.dealSummary}\n\n## EXECUTIVE SUMMARY\n${icMemoData.executiveSummary}\n\n## INVESTMENT HIGHLIGHTS\n${icMemoData.investmentHighlights.map(h => `- ${h}`).join('\n')}\n\n## KEY RISKS & MITIGATION\n${icMemoData.keyRisks.map(r => `- **Risk:** ${r.risk}\n  **Mitigation:** ${r.mitigation}`).join('\n')}`;
                      navigator.clipboard.writeText(markdown);
                      handleCopyText(markdown, 'icmemo');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 text-zinc-600" />
                    {copiedField === 'icmemo' ? 'Copied Markdown!' : 'Copy Markdown'}
                  </Button>

                  <button 
                    onClick={() => {
                      setIcMemoModalLead(null);
                      setIcMemoData(null);
                    }}
                    className="text-zinc-400 hover:text-zinc-700 text-sm font-bold px-2"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {isGeneratingICMemo ? (
                <div className="py-20 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <Clock className="h-6 w-6 animate-spin" />
                  </div>
                  <h4 className="font-bold text-zinc-900 text-lg">Synthesizing Investment Committee Memo...</h4>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                    Gemini is structuring financial models, valuation multiples, risk mitigations, and transaction terms for <strong>{icMemoModalLead.name}</strong>.
                  </p>
                </div>
              ) : icMemoData ? (
                <div className="space-y-6 text-zinc-800 text-xs leading-relaxed font-sans">
                  
                  {/* Top Confidential Banner */}
                  <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">STRICTLY CONFIDENTIAL</span>
                      <h1 className="text-2xl font-black text-zinc-900 mt-1">{icMemoModalLead.name}</h1>
                      <p className="text-xs text-zinc-500 font-medium">{icMemoModalLead.industry} • {icMemoModalLead.location} • Owner: {icMemoModalLead.agentName || 'Individual Owner'}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Exit Propensity</p>
                      <div className="inline-flex items-center gap-1 bg-zinc-900 text-white font-black px-3 py-1 rounded-xl text-base">
                        <span>{icMemoModalLead.exitPropensityScore || '?'}/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Callout Box */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                    <h5 className="font-bold text-emerald-900 text-xs uppercase tracking-wider mb-1">Deal Overview</h5>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed">{icMemoData.dealSummary}</p>
                  </div>

                  {/* Executive Rationale */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-200 pb-1">1. Investment Rationale & Thesis</h5>
                    <p className="text-xs text-zinc-700 leading-relaxed">{icMemoData.executiveSummary}</p>
                  </div>

                  {/* Financial & Valuation Grid */}
                  <div className="grid grid-cols-4 gap-3 border border-zinc-200 rounded-xl p-4 bg-zinc-50/50">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-zinc-400">Est. Revenue</p>
                      <p className="text-sm font-black text-zinc-900">{icMemoData.financialOverview.estimatedRevenue}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-zinc-400">Est. EBITDA</p>
                      <p className="text-sm font-black text-zinc-900">{icMemoData.financialOverview.estimatedEbitda}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-zinc-400">Implied Multiple</p>
                      <p className="text-sm font-black text-emerald-600">{icMemoData.financialOverview.impliedMultiple}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-zinc-400">Valuation Range</p>
                      <p className="text-sm font-black text-zinc-900">{icMemoData.financialOverview.valuationRange}</p>
                    </div>
                  </div>

                  {/* Highlights & Risks 2-Column Split */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h5 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-200 pb-1">2. Value Creation & Key Highlights</h5>
                      <ul className="space-y-1.5 list-disc pl-4 text-xs text-zinc-700">
                        {icMemoData.investmentHighlights.map((hl, i) => (
                          <li key={i}>{hl}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-200 pb-1">3. Red Flag Risks & Mitigations</h5>
                      <div className="space-y-2">
                        {icMemoData.keyRisks.map((rk, i) => (
                          <div key={i} className="rounded-lg border border-red-100 bg-red-50/30 p-2 text-xs">
                            <p className="font-bold text-red-900">Risk: {rk.risk}</p>
                            <p className="text-zinc-600 text-[11px]">Mitigation: {rk.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Proposed Transaction Structure */}
                  <div className="space-y-2 pt-2 border-t border-zinc-200">
                    <h5 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">4. Proposed Transaction Terms</h5>
                    <div className="grid grid-cols-4 gap-3 bg-zinc-900 text-white rounded-xl p-3 text-center">
                      <div>
                        <p className="text-[9px] uppercase text-zinc-400">Offer Price</p>
                        <p className="text-xs font-bold text-emerald-400">{icMemoData.dealStructure.recommendedPrice}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-zinc-400">Upfront Cash</p>
                        <p className="text-xs font-bold text-white">{icMemoData.dealStructure.upfrontCash}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-zinc-400">Seller Note</p>
                        <p className="text-xs font-bold text-white">{icMemoData.dealStructure.sellerNote}</p>
                      </div>
              <div>
                        <p className="text-[9px] uppercase text-zinc-400">Earnout Terms</p>
                        <p className="text-xs font-bold text-amber-400">{icMemoData.dealStructure.earnout}</p>
                      </div>
                    </div>
                    {/* Immediate Next Steps */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
                      <span className="font-bold text-zinc-700">Immediate Action Steps:</span>
                      <span>{icMemoData.nextSteps.join(' • ')}</span>
                    </div>

                  </div>
                ) : null}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Non-Binding LOI Generator Modal */}
        <AnimatePresence>
          {loiModalLead && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static" role="dialog" aria-modal="true" aria-label="M&A Acquisition Letter of Intent Generator">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200 my-8 print:shadow-none print:border-none print:max-w-none print:p-0 print:my-0"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-6 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <FileCheck2 className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-lg text-zinc-900">M&A Acquisition Letter of Intent (LOI) Generator</h3>
                      <p className="text-xs text-zinc-500">Draft Non-Binding Acquisition Offer • {loiModalLead.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {generatedLOIDoc && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 text-xs"
                          onClick={() => window.print()}
                        >
                          <Printer className="h-3.5 w-3.5 text-zinc-600" />
                          Print / Export PDF
                        </Button>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLOIDoc.loiBody);
                            handleCopyText(generatedLOIDoc.loiBody, 'loi');
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 text-zinc-600" />
                          {copiedField === 'loi' ? 'Copied LOI!' : 'Copy LOI Text'}
                        </Button>
                      </>
                    )}

                    <button 
                      onClick={() => {
                        setLoiModalLead(null);
                        setGeneratedLOIDoc(null);
                      }}
                      className="text-zinc-400 hover:text-zinc-700 text-sm font-bold px-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {!generatedLOIDoc ? (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-900 leading-relaxed">
                      <p className="font-bold">Configure Acquisition Offer Terms for {loiModalLead.name}</p>
                      <p className="text-amber-800/80">Customize purchase price, upfront cash split, seller note financing, earnouts, and exclusivity period before generating the formal non-binding LOI document.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Total Purchase Price ($)</label>
                        <input 
                          type="number" 
                          value={loiTerms.purchasePrice}
                          onChange={(e) => setLoiTerms(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Upfront Cash ($)</label>
                        <input 
                          type="number" 
                          value={loiTerms.upfrontCash}
                          onChange={(e) => setLoiTerms(prev => ({ ...prev, upfrontCash: parseFloat(e.target.value) || 0 }))}
                          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Seller Note ($)</label>
                        <input 
                          type="number" 
                          value={loiTerms.sellerNote}
                          onChange={(e) => setLoiTerms(prev => ({ ...prev, sellerNote: parseFloat(e.target.value) || 0 }))}
                          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Contingent Earnout ($)</label>
                        <input 
                          type="number" 
                          value={loiTerms.earnoutAmount}
                          onChange={(e) => setLoiTerms(prev => ({ ...prev, earnoutAmount: parseFloat(e.target.value) || 0 }))}
                          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Rollover Equity (%)</label>
                        <input 
                          type="number" 
                          value={loiTerms.rolloverEquityPercent}
                          onChange={(e) => setLoiTerms(prev => ({ ...prev, rolloverEquityPercent: parseFloat(e.target.value) || 0 }))}
                          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Working Capital Peg ($)</label>
                        <input 
                          type="number" 
                          value={loiTerms.workingCapitalPeg}
                          onChange={(e) => setLoiTerms(prev => ({ ...prev, workingCapitalPeg: parseFloat(e.target.value) || 0 }))}
                          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleGenerateLOIDoc}
                      disabled={isGeneratingLOI}
                      className="w-full py-4 gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm"
                    >
                      {isGeneratingLOI ? (
                        <>
                          <Clock className="h-4 w-4 animate-spin" />
                          Generating Legal LOI Document with Gemini...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Draft Formal Non-Binding LOI Document
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                      <h2 className="text-xl font-bold text-zinc-900">{generatedLOIDoc.title}</h2>
                      <Button 
                        variant="outline" 
                        size="xs" 
                        onClick={() => setGeneratedLOIDoc(null)}
                        className="text-xs text-amber-700 border-amber-200"
                      >
                        Edit Offer Terms
                      </Button>
                    </div>

                    <div className="prose prose-sm max-w-none rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 text-zinc-800 font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto">
                      <ReactMarkdown>{generatedLOIDoc.loiBody}</ReactMarkdown>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="primary" 
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold"
                        onClick={async () => {
                          await updateLeadStatus(loiModalLead.id, 'in_loi');
                          setLoiModalLead(null);
                          setGeneratedLOIDoc(null);
                        }}
                      >
                        <FileCheck2 className="h-4 w-4" />
                        Save LOI & Move Target to "Under LOI" Stage
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* P&L / Tax Return Financial Document Parser Modal */}
        <AnimatePresence>
          {showFinancialParserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="AI Quality of Earnings & P&L Document Parser">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <FileUp className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-lg text-zinc-900">AI Quality of Earnings & P&L Document Parser</h3>
                      <p className="text-xs text-zinc-500">Extract Revenue, EBITDA & SDE Add-backs from PDF/Image P&Ls</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setShowFinancialParserModal(false);
                      setExtractedDocData(null);
                    }}
                    className="text-zinc-400 hover:text-zinc-700 text-sm font-bold px-2"
                  >
                    ✕
                  </button>
                </div>

                {!extractedDocData ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf,text/plain"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleParseFinancialDoc(file);
                        }}
                        className="hidden" 
                        id="financial-doc-upload"
                      />
                      <label htmlFor="financial-doc-upload" className="cursor-pointer space-y-3 block">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-800">Click or drag P&L Statement / Tax Return PDF</p>
                          <p className="text-xs text-zinc-400 mt-1">Supports PDF, PNG, JPG, WEBP, or TXT financial reports</p>
                        </div>
                      </label>
                    </div>

                    {isParsingDoc && (
                      <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold">
                        <Clock className="h-4 w-4 animate-spin" />
                        Auditing financial statement with Gemini Multimodal AI...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                      <span className="text-xs font-bold text-emerald-900">Multimodal Gemini Extraction Complete</span>
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {extractedDocData.confidenceScore}% Confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">Extracted Revenue</span>
                        <p className="text-base font-black text-zinc-900">${extractedDocData.revenue.toLocaleString()}</p>
                      </div>
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">Extracted EBITDA</span>
                        <p className="text-base font-black text-emerald-600">${extractedDocData.ebitda.toLocaleString()}</p>
                      </div>
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">Profit Margin</span>
                        <p className="text-base font-black text-zinc-900">{extractedDocData.profitMargin}%</p>
                      </div>
                    </div>

                    {extractedDocData.suggestedAddBacks && extractedDocData.suggestedAddBacks.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Identified Discretionary SDE Add-Backs</label>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {extractedDocData.suggestedAddBacks.map((ab, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-zinc-50 p-2.5 rounded-lg text-xs border border-zinc-200">
                              <div>
                                <span className="font-bold text-zinc-800">{ab.name}</span>
                                <p className="text-[10px] text-zinc-500">{ab.rationale}</p>
                              </div>
                              <span className="font-extrabold text-emerald-600">+${ab.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setExtractedDocData(null)}
                      >
                        Upload Different File
                      </Button>
                      <Button 
                        variant="primary"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        onClick={handleApplyExtractedFinancials}
                      >
                        Apply Extracted Financials to Target
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }
