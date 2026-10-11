// src/hooks/useRealtimeBoard.js

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

// ── Buat Echo baru dengan token terbaru ───────────────────────
// function createEcho() {
//   window.Pusher = Pusher;

//   return new Echo({
//     broadcaster: "reverb",
//     key: import.meta.env.VITE_REVERB_APP_KEY,
//     wsHost: import.meta.env.VITE_REVERB_HOST ?? "localhost",
//     wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
//     wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
//     forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https",
//     enabledTransports: ["ws", "wss"],
//     authEndpoint: `${import.meta.env.VITE_API_URL?.replace("/api", "")}/broadcasting/auth`,
//     auth: {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("token")}`,
//         Accept: "application/json",
//       },
//     },
//   });
// }


function createEcho(token) {
  window.Pusher = Pusher;

  return new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: "127.0.0.1",
    wsPort: 8080,
    forceTLS: false,
    enabledTransports: ["ws"],
    authEndpoint: "http://127.0.0.1:8000/api/broadcasting/auth", // ← fix di sini
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });
}





// ── Tipe notifikasi untuk UI ──────────────────────────────────
function makeNotif(type, actor, payload) {
  const actions = {
    column_reordered: `memindahkan urutan kolom`,
    column_created:   `membuat kolom baru "${payload.column?.name}"`,
    column_deleted:   `menghapus sebuah kolom`,
    column_renamed:   `mengganti nama kolom menjadi "${payload.name}"`,
    card_moved:       `memindahkan sebuah card`,
    card_created:     `menambah card baru`,
    card_updated:     `mengupdate sebuah card`,
    card_deleted:     `menghapus sebuah card`,
    comment_added:    `menambah komentar`,
    comment_deleted:  `menghapus komentar`,
  };
  return {
    id:        Date.now() + Math.random(),
    user:      actor.name,
    action:    actions[type] || type,
    time:      new Date().toISOString(),
    read:      false,
    _realtime: true,
  };
}

// ── MAIN HOOK ─────────────────────────────────────────────────
export function useRealtimeBoard({
  boardId,
  currentUserId,
  onNotification,
  onActivityLog,
  onPresenceChange,
}) {
  const qc      = useQueryClient();
  const echoRef = useRef(null);

//   useEffect(() => {
//     if (!boardId) return;

//     // Buat Echo baru setiap mount dengan token terbaru
//     const echo    = createEcho();
//     echoRef.current = echo;

    

// // 🔥 TAMBAHKAN DI SINI
// echo.connector.pusher.connection.bind("connected", () => {
//   console.log("✅ CONNECTED:", echo.socketId());
// });

// echo.connector.pusher.connection.bind("error", (err) => {
//   console.error("❌ WS ERROR:", err);
// });



useEffect(() => {
  if (!boardId) return;

  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("⛔ Token belum ada, skip Echo init");
    return;
  }

  const echo = createEcho(token);
  echoRef.current = echo;

  // ✅ DEBUG (cukup sekali)
  echo.connector.pusher.connection.bind("connected", () => {
    console.log("✅ CONNECTED:", echo.socketId());
  });

  echo.connector.pusher.connection.bind("error", (err) => {
    console.error("❌ WS ERROR:", err);
  });

  





    const channel = echo.join(`board.${boardId}`);

    // ── Presence ─────────────────────────────────────────────
    channel
      .here((users) => onPresenceChange?.(users))
      .joining((user) => {
        onPresenceChange?.((prev = []) => [...prev, user]);
      })
      .leaving((user) => {
        onPresenceChange?.((prev = []) => prev.filter(u => u.id !== user.id));
      });

    // ── Listen perubahan board ────────────────────────────────
    channel.listen(".board.updated", (event) => {
      const { type, payload, actor, timestamp } = event;

      // Skip event dari diri sendiri (sudah optimistic)
      if (String(actor.id) === String(currentUserId)) return;

      // Update cache langsung tanpa refetch
      qc.setQueryData(["board-detail", boardId], (old) => {
        if (!old) return old;
        return applyEvent(old, type, payload);
      });

      const notif = makeNotif(type, actor, payload);
      onNotification?.(notif);
      onActivityLog?.({
        id:     Date.now(),
        user:   actor.name,
        action: notif.action,
        time:   timestamp,
      });
    });

    return () => {
      echo.leave(`board.${boardId}`);
      echo.disconnect();
      echoRef.current = null;
    };
  }, [boardId, currentUserId]); // eslint-disable-line
}

// ── Apply event ke state board ────────────────────────────────
function applyEvent(board, type, payload) {
  switch (type) {

    case "column_reordered": {
      const { column_ids } = payload;
      const colMap = Object.fromEntries(board.columns.map(c => [c.id, c]));
      const reordered = column_ids.map(id => colMap[id]).filter(Boolean);
      const reorderedIds = new Set(column_ids);
      const rest = board.columns.filter(c => !reorderedIds.has(c.id));
      return { ...board, columns: [...reordered, ...rest] };
    }

    case "column_created": {
      const exists = board.columns.find(c => c.id === payload.column.id);
      if (exists) return board;
      return { ...board, columns: [...board.columns, payload.column] };
    }

    case "column_deleted": {
      return {
        ...board,
        columns: board.columns.filter(c => c.id !== payload.column_id),
      };
    }

    case "column_renamed": {
      return {
        ...board,
        columns: board.columns.map(c =>
          c.id === payload.column_id ? { ...c, name: payload.name } : c
        ),
      };
    }

    case "card_moved": {
      const { task_id, column_id, position } = payload;
      let movedTask = null;

      const colsWithout = board.columns.map(col => {
        const idx = (col.tasks || []).findIndex(t => t.id === task_id);
        if (idx !== -1) {
          movedTask = col.tasks[idx];
          return { ...col, tasks: col.tasks.filter(t => t.id !== task_id) };
        }
        return col;
      });

      if (!movedTask) return board;

      const newCols = colsWithout.map(col => {
        if (col.id !== column_id) return col;
        const tasks = [...(col.tasks || [])];
        tasks.splice(Math.min(position, tasks.length), 0, movedTask);
        return { ...col, tasks };
      });

      return { ...board, columns: newCols };
    }

    case "card_created": {
      return {
        ...board,
        columns: board.columns.map(col => {
          if (col.id !== payload.task.column_id) return col;
          const exists = (col.tasks || []).find(t => t.id === payload.task.id);
          if (exists) return col;
          return { ...col, tasks: [...(col.tasks || []), payload.task] };
        }),
      };
    }

    case "card_updated": {
      return {
        ...board,
        columns: board.columns.map(col => ({
          ...col,
          tasks: (col.tasks || []).map(t =>
            t.id === payload.task.id ? { ...t, ...payload.task } : t
          ),
        })),
      };
    }

    case "card_deleted": {
      return {
        ...board,
        columns: board.columns.map(col => ({
          ...col,
          tasks: (col.tasks || []).filter(t => t.id !== payload.task_id),
        })),
      };
    }

    case "comment_added": {
      return {
        ...board,
        columns: board.columns.map(col => ({
          ...col,
          tasks: (col.tasks || []).map(t => {
            if (t.id !== payload.task_id) return t;
            const exists = (t.comments || []).find(c => c.id === payload.comment.id);
            if (exists) return t;
            return { ...t, comments: [...(t.comments || []), payload.comment] };
          }),
        })),
      };
    }

    case "comment_deleted": {
      return {
        ...board,
        columns: board.columns.map(col => ({
          ...col,
          tasks: (col.tasks || []).map(t => {
            if (t.id !== payload.task_id) return t;
            return {
              ...t,
              comments: (t.comments || []).filter(c => c.id !== payload.comment_id),
            };
          }),
        })),
      };
    }

    default:
      return board;
  }
}