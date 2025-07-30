import React, { useEffect, useState } from "react";
import { Plus, Users, Key, Copy, Check, LogOut } from "lucide-react";
import { createRoom, getRooms, joinRoomByCode } from "../service/roomService";
import { useAuth } from "../hooks/useAuth";
import { encryption } from "../utils/encryption";
import bgimage from "../assets/bgimg.png";
import { RoomSelectorComp } from "./room-selector";
interface Room {
  _id: string;
  name: string;
  code: string;
  lastMessage?: any;
  lastActivity?: Date;
}

interface RoomSelectorProps {
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string) => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({
  onSelectRoom,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const { accessToken, logout } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRooms(accessToken)
      .then((data) => {
        console.log(data, "Fetched rooms data");
        setRooms(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        alert("Failed to fetch rooms: " + err.message);
      });
  }, [accessToken]);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    try {
      const result = await createRoom(roomName, accessToken);
      setRooms([result.room, ...rooms]);
      onSelectRoom(result.room._id); // use _id from backend
    } catch (e) {
      alert("Failed to create room: " + e.message);
    }
    setShowCreateModal(false);
    setRoomName("");
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) return;
    try {
      const result = await joinRoomByCode(roomCode, accessToken);
      setRooms([result.room, ...rooms]);
      onSelectRoom(result.room._id);
    } catch (e) {
      alert("Failed to join room: " + e.message);
    }
    setShowJoinModal(false);
    setRoomCode("");
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };
  const handleSelectRoom = (roomId: string) => {  
    console.log(`Selected room: ${roomId}`);
    onSelectRoom(roomId);
  }
  const handleLogout = async () => {
    await logout();
  };

  return <RoomSelectorComp onSelectRoom={handleSelectRoom} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />


  // return (
  //   <div
  //     className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4"
  //     style={{
  //       backgroundImage: `url(${bgimage})`, // Correct way to use imported image
  //       backgroundSize: "cover", // Adjust to cover the entire div
  //       backgroundPosition: "center", // Center the image
  //     }}
  //   >
  //     <div className="max-w-md mx-auto my-auto">
  //       <div className="text-center mb-8 pt-8">
  //         <h1 className="text-3xl font-bold text-black/60 mb-2">
  //           Your Private Rooms
  //         </h1>
  //         <p className="text-black/60">Create or join a private space</p>
  //       </div>

  //       {/* Room List */}
  //       <div className="space-y-4 mb-8">
  //         {rooms.map((room) => (
  //           <div
  //             key={room._id}
  //             onClick={() => onSelectRoom(room._id)}
  //             className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition-all"
  //           >
  //             <div className="flex items-center justify-between mb-2">
  //               <h3 className="text-white font-semibold">{room.name}</h3>
  //               <button
  //                 onClick={(e) => {
  //                   e.stopPropagation();
  //                   copyCode(room.code);
  //                 }}
  //                 className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
  //               >
  //                 {copiedCode === room.code ? (
  //                   <Check className="w-4 h-4" />
  //                 ) : (
  //                   <Copy className="w-4 h-4" />
  //                 )}
  //                 <span className="text-sm">{room.code}</span>
  //               </button>
  //             </div>
  //             {room.lastMessage && (
  //               <p className="text-gray-300 text-sm truncate">
  //                 {encryption
  //                   .decrypt(room.lastMessage?.content)
  //                   .substring(0, 50)}
  //               </p>
  //             )}
  //           </div>
  //         ))}
  //       </div>

  //       {/* Action Buttons */}
  //       <div className="space-y-3">
  //         <button
  //           onClick={() => setShowCreateModal(true)}
  //           className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex items-center justify-center space-x-2"
  //         >
  //           <Plus className="w-5 h-5" />
  //           <span>Create New Room</span>
  //         </button>

  //         <button
  //           onClick={() => setShowJoinModal(true)}
  //           className="w-full py-3 bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all flex items-center justify-center space-x-2"
  //         >
  //           <Key className="w-5 h-5" />
  //           <span>Join with Code</span>
  //         </button>

  //         <button
  //           onClick={handleLogout}
  //           className="w-full py-3 bg-red-500 backdrop-blur-lg border border-white/20 text-white rounded-lg font-semibold hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all flex items-center justify-center space-x-2"
  //         >
  //           <LogOut className="w-5 h-5" />
  //           <span>Log Out</span>
  //         </button>
  //       </div>
  //     </div>

  //     {/* Create Room Modal */}
  //     {showCreateModal && (
  //       <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
  //         <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-sm border border-white/20">
  //           <h3 className="text-xl font-bold text-white mb-4">
  //             Create Private Room
  //           </h3>
  //           <input
  //             type="text"
  //             placeholder="Room name (e.g., 'Our Space')"
  //             value={roomName}
  //             onChange={(e) => setRoomName(e.target.value)}
  //             className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
  //             autoFocus
  //           />
  //           <div className="flex space-x-3">
  //             <button
  //               onClick={() => setShowCreateModal(false)}
  //               className="flex-1 py-2 text-gray-300 hover:text-white transition-colors"
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               onClick={handleCreateRoom}
  //               className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
  //             >
  //               Create
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     )}

  //     {/* Join Room Modal */}
  //     {showJoinModal && (
  //       <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
  //         <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-sm border border-white/20">
  //           <h3 className="text-xl font-bold text-white mb-4">
  //             Join Private Room
  //           </h3>
  //           <input
  //             type="text"
  //             placeholder="Enter room code"
  //             value={roomCode}
  //             onChange={(e) => setRoomCode(e.target.value)}
  //             className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
  //             autoFocus
  //           />
  //           <div className="flex space-x-3">
  //             <button
  //               onClick={() => setShowJoinModal(false)}
  //               className="flex-1 py-2 text-gray-300 hover:text-white transition-colors"
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               onClick={handleJoinRoom}
  //               className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
  //             >
  //               Join
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
};
