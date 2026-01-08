import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity, Server, Wifi, Box, ChevronRight, MessageSquare, Database } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Types ---

interface ApiLog {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  body: any;
  query: any;
  timestamp: number;
}

interface SocketLog {
  id: string;
  event: string;
  args?: any[];
  payload?: any;
  socketId?: string;
  userId?: string;
  timestamp: number;
  direction?: 'in' | 'out';
}

interface Room {
  roomId: string;
  createdBy: string;
  admins: string[];
  members: any[];
  bannedUserIds: string[];
}

// --- Components ---

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
    <div className="flex items-center justify-between mb-2">
      <span className="text-slate-400 text-sm font-medium">{title}</span>
      <Icon className={cn("w-4 h-4", color)} />
    </div>
    <div className="text-2xl font-bold text-white">{value}</div>
  </div>
);

const LogItem = ({ log, type, onClick }: { log: any, type: 'api' | 'socket', onClick: () => void }) => {
  const isError = type === 'api' ? log.status >= 400 : false;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg mb-2 text-sm cursor-pointer transition-colors border-l-4",
        "bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-slate-600",
        isError ? "border-l-red-500" : (type === 'api' ? "border-l-blue-500" : "border-l-emerald-500")
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-1.5 py-0.5 rounded textxs font-bold uppercase",
            type === 'api' ? "bg-blue-900/50 text-blue-400" : (
              log.direction === 'out' ? "bg-orange-900/50 text-orange-400" : "bg-emerald-900/50 text-emerald-400"
            )
          )}>
            {type === 'api' ? log.method : (log.direction === 'out' ? 'OUT' : 'IN')}
          </span>
          <span className="font-mono text-slate-200">
            {type === 'api' ? log.url : log.event}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>{type === 'api' ? `Status: ${log.status}` : `Socket: ${log.socketId ? log.socketId.slice(0, 6) : 'Server'}...`}</span>
        <span>{type === 'api' ? `${log.duration}ms` : (log.userId ? `User: ${log.userId}` : '')}</span>
      </div>
    </div>
  );
};

// --- App ---

const URL = import.meta.env.VITE_API_URL || 'https://code.samlepirate.org';
const ADMIN_KEY = 'dev-secret-key-123'; // Hardcoded for demo

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    if (socket) console.log("Socket state updated");
  }, [socket]);

  const [connected, setConnected] = useState(false);
  const [view, setView] = useState<'overview' | 'rooms'>('overview');

  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [socketLogs, setSocketLogs] = useState<SocketLog[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomLogs, setRoomLogs] = useState<Map<string, SocketLog[]>>(new Map());

  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    // Initialize Socket.IO
    // We prioritize WebSocket to avoid polling issues with proxies like ngrok
    const socketUrl = URL;
    const newSocket = io(socketUrl, {
      auth: {
        apiKey: ADMIN_KEY,
        userId: 'admin-dashboard'
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['polling', 'websocket'], // Try WebSocket first
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to backend');
      console.log('Transport used:', newSocket.io.engine.transport.name);

      newSocket.io.engine.on("upgrade", () => {
        console.log("Transport upgraded to:", newSocket.io.engine.transport.name);
      });

      // Join admin room to get updates
      newSocket.emit('room:join', { roomId: 'admin-room' });
      // Fetch initial rooms
      fetchRooms();
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('Disconnected:', reason);
    });

    newSocket.on('monitor:api:request', (data) => {
      const log = { ...data, id: Math.random().toString(36).substr(2, 9) };
      setApiLogs(prev => [log, ...prev].slice(0, 50));
    });

    newSocket.on('monitor:socket:incoming', (data) => {
      const log: SocketLog = { ...data, id: Math.random().toString(36).substr(2, 9), direction: 'in' };
      setSocketLogs(prev => [log, ...prev].slice(0, 50));

      // Attempt to associate incoming room events
      const payload = data.args[0];
      if (payload && typeof payload === 'object' && payload.roomId) {
        setRoomLogs(prev => {
          const newMap = new Map(prev);
          const roomList = newMap.get(payload.roomId) || [];
          newMap.set(payload.roomId, [log, ...roomList].slice(0, 50));
          return newMap;
        });
      }
    });

    newSocket.on('monitor:socket:outgoing', (data) => {
      const log: SocketLog = {
        id: Math.random().toString(36).substr(2, 9),
        event: data.event,
        payload: data.payload,
        timestamp: data.timestamp,
        direction: 'out',
        userId: data.payload?.from || 'Server' // Try to see who caused it
      };
      setSocketLogs(prev => [log, ...prev].slice(0, 50));

      if (data.roomId) {
        setRoomLogs(prev => {
          const newMap = new Map(prev);
          const roomList = newMap.get(data.roomId) || [];
          newMap.set(data.roomId, [log, ...roomList].slice(0, 50));
          return newMap;
        });
      }
    });

    setSocket(newSocket);

    // Poll rooms every 5s
    const interval = setInterval(fetchRooms, 5000);

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${URL}/v1/rooms`, {
        headers: { 'x-api-key': ADMIN_KEY }
      });
      const data = await res.json();
      setRooms(data);
    } catch (e) {
      console.error("Failed to fetch rooms", e);
    }
  };

  const getRoomLogs = (roomId: string) => {
    // Return logs filtered by checking if any arg contains roomId or if it's in our map
    return roomLogs.get(roomId) || [];
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex text-sm">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            SuperAPi Admin v1.0.0
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={cn("w-2 h-2 rounded-full", connected ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            <span className="text-xs text-slate-500">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <button
            onClick={() => setView('overview')}
            className={cn("w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
              view === 'overview' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            )}
          >
            <Activity className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setView('rooms')}
            className={cn("w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
              view === 'rooms' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            )}
          >
            <Box className="w-4 h-4" />
            Rooms
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center Panel */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
          {view === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <StatCard title="Active Rooms" value={rooms.length} icon={Box} color="text-blue-400" />
                <StatCard title="API Requests" value={apiLogs.length} icon={Server} color="text-purple-400" />
                <StatCard title="Socket Events" value={socketLogs.length} icon={Wifi} color="text-emerald-400" />
              </div>

              <div className="grid grid-cols-2 gap-6 h-[600px]">
                {/* API Logs */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="font-bold flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-400" />
                      API Traffic
                    </h2>
                    <span className="text-xs px-2 py-1 bg-slate-900 rounded-full text-slate-500">Last 50</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
                    {apiLogs.map(log => (
                      <LogItem key={log.id} log={log} type="api" onClick={() => setSelectedLog(log)} />
                    ))}
                  </div>
                </div>

                {/* Socket Logs */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="font-bold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      Socket Events
                    </h2>
                    <span className="text-xs px-2 py-1 bg-slate-900 rounded-full text-slate-500">Last 50</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
                    {socketLogs.map(log => (
                      <LogItem key={log.id} log={log} type="socket" onClick={() => setSelectedLog(log)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'rooms' && (
            <div className="max-w-6xl mx-auto">
              {!selectedRoom ? (
                <div className="grid grid-cols-3 gap-4">
                  {rooms.map(room => (
                    <div
                      key={room.roomId}
                      onClick={() => setSelectedRoom(room)}
                      className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-blue-900/20 transition-colors">
                          <Box className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          {room.members.length} members <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-white mb-1">{room.roomId}</h3>
                      <p className="text-xs text-slate-400">Created by {room.createdBy}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="text-sm text-slate-400 hover:text-white flex items-center gap-2"
                  >
                    ← Back to Rooms
                  </button>

                  <div className="grid grid-cols-3 gap-6 h-[calc(100vh-120px)]">
                    {/* Room Details Column */}
                    <div className="space-y-6">
                      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                        <h2 className="text-2xl font-bold text-white mb-4">{selectedRoom.roomId}</h2>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Created By</label>
                            <div className="text-slate-300">{selectedRoom.createdBy}</div>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Admins</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedRoom.admins.map(a => (
                                <span key={a} className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs">{a}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex-1">
                        <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Connected Members
                        </h3>
                        <div className="space-y-2">
                          {selectedRoom.members.map((m: any) => (
                            <div key={m.socketId} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                              <div>
                                <div className="font-medium text-white">{m.userId}</div>
                                <div className="text-xs text-slate-500 font-mono">{m.socketId.slice(0, 8)}</div>
                              </div>
                              {m.isAdmin && <span className="text-xs bg-yellow-900/30 text-yellow-500 px-2 py-1 rounded">Admin</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Room Logs Column */}
                    <div className="col-span-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
                      <div className="p-4 border-b border-slate-800">
                        <h3 className="font-bold text-slate-300 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-400" />
                          Room Activity Log (Payloads)
                        </h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
                        {getRoomLogs(selectedRoom.roomId).length === 0 ? (
                          <div className="text-center text-slate-500 mt-10">No activity recorded for this room yet.</div>
                        ) : (
                          getRoomLogs(selectedRoom.roomId).map(log => (
                            <div key={log.id} onClick={() => setSelectedLog(log)} className="mb-3 cursor-pointer group">
                              <div className="flex items-center justify-between text-xs text-slate-500 mb-1 px-2">
                                <span className="font-mono text-emerald-400">{log.event}</span>
                                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 group-hover:border-slate-600 font-mono text-xs text-slate-300 whitespace-pre-wrap break-all">
                                {JSON.stringify(log.args || log.payload || {}, null, 2)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Inspector */}
        {selectedLog && (
          <div className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl absolute right-0 h-full">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-200">Payload Inspector</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Type</label>
                  <span className="px-2 py-1 bg-slate-800 rounded text-sm text-white">
                    {selectedLog.method ? 'API Request' : 'Socket Event'}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold block mb-1">
                    {selectedLog.method ? 'URL' : 'Event Name'}
                  </label>
                  <div className="font-mono text-sm text-blue-400 break-all">
                    {selectedLog.method ? selectedLog.url : selectedLog.event}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Payload / Body</label>
                  <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto">
                    {JSON.stringify(
                      selectedLog.method
                        ? { body: selectedLog.body, query: selectedLog.query }
                        : (selectedLog.payload ? selectedLog.payload : selectedLog.args),
                      null, 2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
