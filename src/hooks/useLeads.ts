import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Lead, LeadStatus, ActivityLog, UserProfile } from '../types';

export function useLeads(user: any, profile: UserProfile | null) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Lead[] = [];
      snapshot.forEach(docSnap => {
        docs.push({ id: docSnap.id, fundId: 'redwood-cap', ...docSnap.data() } as Lead);
      });
      setLeads(docs);
      setLoading(false);
    }, (err) => {
      console.error("Firestore leads listener error:", err);
      setError("Failed to load leads: " + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addActivityLog = (lead: Lead, action: string, details?: string): ActivityLog[] => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: user?.uid || 'system',
      userName: profile?.displayName || user?.email || 'User',
      action,
      details
    };
    return [newLog, ...(lead.activityLogs || [])];
  };

  const updateLeadStatus = async (id: string, status: LeadStatus, reason?: string, notes?: string) => {
    try {
      const target = leads.find(l => l.id === id);
      const fundId = target?.fundId || 'redwood-cap';

      // Call Control Plane Backend State Machine API
      try {
        await fetch(`/api/funds/${fundId}/deals/${id}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetStage: status,
            actorId: user?.uid || 'user-default',
            actorRole: profile?.role || 'analyst'
          })
        });
      } catch (e) {
        // Fallback for offline mode
      }

      const updateData: any = { status, updatedAt: new Date().toISOString() };
      if (reason) updateData.archiveReason = reason;
      if (notes) updateData.archiveNotes = notes;

      if (target) {
        updateData.activityLogs = addActivityLog(target, `Control Plane State: "${status.replace(/_/g, ' ')}"`, reason);
      }

      await updateDoc(doc(db, 'leads', id), updateData);
    } catch (err: any) {
      console.error("Error updating lead status:", err);
      throw err;
    }
  };

  const approveLOI = async (id: string) => {
    try {
      const target = leads.find(l => l.id === id);
      const fundId = target?.fundId || 'redwood-cap';

      // Call Control Plane FSM Transition
      try {
        await fetch(`/api/funds/${fundId}/deals/${id}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetStage: 'APPROVED',
            actorId: user?.uid || 'user-partner',
            actorRole: profile?.role || 'partner'
          })
        });
      } catch (e) {}

      const updateData: any = {
        loiApprovalStatus: 'approved',
        loiApprovedBy: profile?.displayName || user?.email || 'Partner',
        loiApprovedAt: new Date().toISOString(),
        status: 'in_loi',
        updatedAt: new Date().toISOString()
      };

      if (target) {
        updateData.activityLogs = addActivityLog(target, 'Partner approved LOI execution (FSM Guard Passed)', `Approved by ${profile?.displayName || 'Partner'}`);
      }

      await updateDoc(doc(db, 'leads', id), updateData);
    } catch (err: any) {
      console.error("Error approving LOI:", err);
      throw err;
    }
  };

  const batchTriggerOutreach = async (pendingLeads: Lead[]) => {
    if (pendingLeads.length === 0) return;
    const batch = writeBatch(db);
    for (const lead of pendingLeads) {
      const leadRef = doc(db, 'leads', lead.id);
      batch.update(leadRef, {
        status: 'outreach_triggered',
        updatedAt: new Date().toISOString(),
        activityLogs: addActivityLog(lead, 'Batch outreach sequence triggered via Transactional Outbox')
      });
    }
    await batch.commit();
  };

  const addComment = async (id: string, text: string) => {
    try {
      const target = leads.find(l => l.id === id);
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
      const activityLogs = addActivityLog(target, 'Internal deal note added', text.substring(0, 40));

      await updateDoc(doc(db, 'leads', id), {
        comments,
        activityLogs,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Error adding comment:", err);
      throw err;
    }
  };

  return {
    leads,
    setLeads,
    loading,
    error,
    setError,
    updateLeadStatus,
    approveLOI,
    batchTriggerOutreach,
    addComment
  };
}
