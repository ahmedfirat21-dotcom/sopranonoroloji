/**
 * SopranoChat Admin — Mesaj İnceleme
 * Şikayet edilen mesajlar + son DM/oda mesajları.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MessageSquare } from 'lucide-react';
import MessagesClient from './MessagesClient';

async function loadReportedMessages() {
  const { data: reports } = await supabaseAdmin
    .from('reports')
    .select('id, reporter_id, reported_user_id, reported_message_id, reason, description, status, created_at')
    .not('reported_message_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!reports || reports.length === 0) return [];

  const messageIds = reports.map(r => r.reported_message_id).filter(Boolean) as string[];
  const userIds = Array.from(new Set([
    ...reports.map(r => r.reporter_id),
    ...reports.map(r => r.reported_user_id).filter(Boolean) as string[],
  ]));

  const [{ data: messages }, { data: profiles }] = await Promise.all([
    supabaseAdmin
      .from('messages')
      .select('id, sender_id, receiver_id, content, room_id, voice_url, image_url, type, is_deleted, created_at')
      .in('id', messageIds),
    supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds),
  ]);

  const msgMap = Object.fromEntries((messages || []).map(m => [m.id, m]));
  const profMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

  return reports.map(r => ({
    ...r,
    message: r.reported_message_id ? msgMap[r.reported_message_id] : null,
    reporter: profMap[r.reporter_id] || null,
    reported_user: r.reported_user_id ? profMap[r.reported_user_id] : null,
  }));
}

async function loadRecentRoomMessages() {
  const { data } = await supabaseAdmin
    .from('messages')
    .select('id, sender_id, content, room_id, type, is_deleted, created_at')
    .not('room_id', 'is', null)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data) return [];

  const senderIds = Array.from(new Set(data.map(m => m.sender_id).filter(Boolean)));
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', senderIds);
  const profMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

  return data.map(m => ({ ...m, sender: profMap[m.sender_id] || null }));
}

export default async function MesajlarPage() {
  const [reported, recent] = await Promise.all([
    loadReportedMessages(),
    loadRecentRoomMessages(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-violet-400" /> Mesaj İnceleme
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {reported.length} şikayet edilen · son {recent.length} oda mesajı
        </p>
      </div>

      <MessagesClient reportedMessages={reported as any} recentMessages={recent as any} />
    </div>
  );
}
