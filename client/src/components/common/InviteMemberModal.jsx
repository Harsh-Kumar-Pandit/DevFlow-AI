import { useState, useEffect } from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

export function InviteMemberModal({ open, onClose, workspaceId, currentWorkspace, onlineUsers = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
  }, [open]);

  // Debounced live user search
  useEffect(() => {
    if (!searchQuery.trim() || !workspaceId) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const delayDebounceFn = setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(searchQuery)}&workspaceId=${workspaceId}`)
        .then((res) => {
          setSearchResults(res.data.users || []);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setSearchLoading(false);
        });
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, workspaceId]);

  const handleSendInvite = async (receiverId) => {
    try {
      await api.post(`/workspace/${workspaceId}/invite`, { receiverId });
      toast.success("Invitation sent successfully.");
      setSearchResults((prev) =>
        prev.map((u) => (u.id === receiverId ? { ...u, hasPendingInvite: true } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    }
  };

  const copyInviteCode = () => {
    if (currentWorkspace?.inviteCode) {
      navigator.clipboard.writeText(currentWorkspace.inviteCode);
      toast.success('Invite code copied!');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite Member" width="max-w-lg">
      <div className="space-y-4">
        <p className="text-xs text-zinc-400">
          Invite an existing DevFlow user to collaborate in this workspace.
        </p>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter username or email..."
            className="w-full bg-[#1A1A22] border border-[#2B2B37] rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchLoading && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
              <div className="h-4.5 w-4.5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </span>
          )}
        </div>

        {/* Results list */}
        <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {searchLoading && searchResults.length === 0 ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900/30 border border-zinc-850/50 rounded-xl">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() !== "" && searchResults.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-zinc-500 font-semibold mb-1">No user found.</p>
              <div className="p-3 bg-zinc-900/30 border border-zinc-850/50 rounded-xl inline-block text-left mt-2">
                <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mb-1">Share Workspace Invite Code</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-indigo-400 font-bold">{currentWorkspace?.inviteCode}</span>
                  <button
                    onClick={copyInviteCode}
                    className="text-[10px] font-bold text-zinc-350 hover:text-white px-2 py-0.5 bg-zinc-850 rounded border border-zinc-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          ) : (
            searchResults.map((usr) => {
              const isOnline = onlineUsers?.includes(usr.id?.toString());
              return (
                <div
                  key={usr.id}
                  className="flex items-center justify-between gap-3 p-3 bg-[#1A1A22] border border-[#2B2B37] rounded-xl hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar user={{ fullName: usr.fullName }} size="xs" />
                      <span className={cn(
                        "absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ring-1 ring-zinc-950",
                        isOnline ? "bg-emerald-400" : "bg-zinc-650"
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{usr.username}</p>
                      <p className="text-[10px] text-zinc-550 truncate">{usr.email}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {usr.isMember ? (
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                        Already Member
                      </span>
                    ) : usr.hasPendingInvite ? (
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-2 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        Invitation Sent
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSendInvite(usr.id)}
                        className="text-[10px] py-1 px-3.5 bg-indigo-500 text-white font-bold rounded-lg"
                      >
                        Invite
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Share Invite Code section at the bottom of the modal */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Share Workspace Invite Code</p>
            <p className="text-xs font-mono font-bold text-indigo-400 mt-0.5">{currentWorkspace?.inviteCode}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={copyInviteCode}>
            Copy Code
          </Button>
        </div>
      </div>
    </Modal>
  );
}
