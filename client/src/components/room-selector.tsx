import type React from "react";
import { useEffect, useState } from "react";
import {
  Plus,
  Key,
  Copy,
  Check,
  LogOut,
  Heart,
  Settings,
  MessageCircle,
  Shield,
  Home,
  Menu,
  X,
} from "lucide-react";
import { createRoom, getRooms, joinRoomByCode } from "../service/roomService";
import { useAuth } from "../hooks/useAuth";
import { encryption } from "../utils/encryption";
import bgimage from "../assets/bgimg.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

export const RoomSelectorComp: React.FC<RoomSelectorProps> = ({
  onSelectRoom,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { accessToken, logout, user } = useAuth();
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
      onSelectRoom(result.room._id);
      onCreateRoom(roomName);
    } catch (e) {
      alert("Failed to create room: " + (e as Error).message);
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
      onJoinRoom(roomCode);
    } catch (e) {
      alert("Failed to join room: " + (e as Error).message);
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

  const handleLogout = async () => {
    await logout();
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  // Enhanced mobile sidebar content with proper styling
  const MobileSidebarContent = () => (
    <div className="h-full flex flex-col bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-xl">
      {/* Mobile Sidebar Header */}
      <div className="border-b border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">PrivateCircle</h2>
              <p className="text-sm text-white/70">Your safe space</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="flex-1 px-4 py-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
            Navigation
          </h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 bg-white/5 rounded-xl p-3 h-auto"
            >
              <Home className="h-5 w-5 mr-3" />
              <span>Rooms</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-3 h-auto"
            >
              <Settings className="h-5 w-5 mr-3" />
              <span>Settings</span>
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
            Privacy
          </h3>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-white font-medium">
                End-to-end encrypted
              </span>
            </div>
            <p className="text-sm text-white/60">
              Your messages are completely private and secure
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Footer */}
      <div className="border-t border-white/20 p-6">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            <AvatarImage
              src={user?.avatar || "/placeholder.svg?height=40&width=40"}
              alt={user?.name || "User"}
            />
            <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || user?.email || "User"}
            </p>
            <p className="text-xs text-white/70 truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-10 w-10 p-0 text-white/70 hover:text-red-400 hover:bg-red-500/10 rounded-full"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Desktop sidebar content
  const DesktopSidebarContent = () => (
    <>
      <SidebarHeader className="border-b border-white/20 p-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">PrivateCircle</h2>
            <p className="text-sm text-white/70">Your safe space</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive
                  className="text-white hover:bg-white/10 bg-white/5 rounded-xl h-12 px-4"
                >
                  <Home className="h-5 w-5" />
                  <span>Rooms</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-12 px-4">
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Privacy
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span className="text-white font-medium">
                  End-to-end encrypted
                </span>
              </div>
              <p className="text-xs text-white/60">
                Your messages are completely private
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/20 p-6">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            <AvatarImage
              src={user?.avatar || "/placeholder.svg?height=40&width=40"}
              alt={user?.name || "User"}
            />
            <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || user?.email || "User"}
            </p>
            <p className="text-xs text-white/70 truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-10 w-10 p-0 text-white/70 hover:text-red-400 hover:bg-red-500/10 rounded-full"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </SidebarFooter>
    </>
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative"
      style={{
        backgroundImage: `url(${bgimage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/20" />

      {/* Mobile Layout */}
      <div className="md:hidden relative z-10">
        {/* Enhanced Mobile Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/20">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 rounded-full p-2"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-80 p-0 border-r border-white/20"
                  style={{ background: "transparent" }}
                >
                  <MobileSidebarContent />
                </SheetContent>
              </Sheet>
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">PrivateCircle</h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge
                variant="secondary"
                className="bg-green-500/20 text-green-300 border-green-400/30 text-xs px-2 py-1"
              >
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                Online
              </Badge>
              <Avatar className="h-8 w-8 ring-2 ring-white/20">
                <AvatarImage
                  src={user?.avatar || "/placeholder.svg?height=32&width=32"}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Enhanced Mobile Content */}
        <main className="p-6 pb-safe space-y-8">
          {/* Mobile Quick Actions */}
          <div className="space-y-4">
            <Card
              className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer active:scale-95 shadow-lg"
              onClick={() => setShowCreateModal(true)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">
                      Create New Room
                    </h3>
                    <p className="text-sm text-white/70">
                      Start a new private conversation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer active:scale-95 shadow-lg"
              onClick={() => setShowJoinModal(true)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg">
                    <Key className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">
                      Join with Code
                    </h3>
                    <p className="text-sm text-white/70">
                      Enter your partner's room code
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Mobile Rooms List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Your Rooms</h2>
              <Badge
                variant="outline"
                className="text-white/70 border-white/30 px-3 py-1"
              >
                {rooms.length} room{rooms.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card
                    key={i}
                    className="bg-white/10 backdrop-blur-xl border-white/20 shadow-lg"
                  >
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-white/20 rounded-full"></div>
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-white/20 rounded w-3/4"></div>
                            <div className="h-3 bg-white/20 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 border-dashed shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 mx-auto mb-6">
                    <MessageCircle className="h-8 w-8 text-white/50" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    No rooms yet
                  </h3>
                  <p className="text-white/70 mb-8 text-sm leading-relaxed">
                    Create your first private room to start chatting securely
                    with your loved ones
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg px-6 py-3 rounded-xl font-semibold"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Room
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rooms.map((room) => (
                  <Card
                    key={room._id}
                    className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer active:scale-95 shadow-lg"
                    onClick={() => onSelectRoom(room._id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-rose-100/20 to-pink-100/20 shadow-lg">
                            <Heart className="h-6 w-6 text-rose-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white mb-1 truncate text-lg">
                              {room.name}
                            </h3>
                            {room.lastMessage && (
                              <p className="text-sm text-white/70 truncate">
                                {encryption
                                  .decrypt(room.lastMessage?.content)
                                  .substring(0, 50)}
                              </p>
                            )}
                            <p className="text-xs text-white/50 mt-1">
                              {room.lastActivity
                                ? new Date(room.lastActivity).toLocaleString()
                                : "No activity"}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCode(room.code);
                          }}
                          className="text-white/70 hover:text-white hover:bg-white/10 ml-2 rounded-xl px-3 py-2"
                        >
                          {copiedCode === room.code ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span className="ml-2 font-mono text-xs">
                            {room.code}
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      {/* New Desktop Layout */}
      <div className="hidden md:block relative min-h-screen bg-background">
        <SidebarProvider>
          <div className="flex-1">
            <header className="pl-64 sticky top-0 z-10 ">
              <div className="flex h-16 items-center justify-between px-8 backdrop-blur-xl bg-black/30 border-b border-white/20">
                <div className="flex items-center space-x-4">
                  {/* <SidebarTrigger className="text-white hover:bg-white/10 rounded-full p-2" /> */}
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      Your Private Rooms
                    </h1>
                    <p className="text-sm text-white/70">
                      Create or join a secure space for two
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Badge
                    variant="secondary"
                    className="bg-green-500/20 text-green-300 border-green-400/30 px-3 py-1.5"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Online
                  </Badge>
                  <Avatar className="h-10 w-10 ring-2 ring-white/20">
                    <AvatarImage
                      src={
                        user?.avatar || "/placeholder.svg?height=40&width=40"
                      }
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </header>
            <Sidebar className="fixed left-0 w-64 z-40 bg-black/30 backdrop-blur-xl">
              <DesktopSidebarContent />
            </Sidebar>

            <div className="pl-64 pt-[72px]">
              <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                  {/* Desktop Quick Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card
                      className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group shadow-lg"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <CardContent className="p-8">
                        <div className="flex items-center space-x-6">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 group-hover:scale-110 transition-transform shadow-lg">
                            <Plus className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-xl mb-2">
                              Create New Room
                            </h3>
                            <p className="text-white/70">
                              Start a new private conversation
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group shadow-lg"
                      onClick={() => setShowJoinModal(true)}
                    >
                      <CardContent className="p-8">
                        <div className="flex items-center space-x-6">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 group-hover:scale-110 transition-transform shadow-lg">
                            <Key className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-xl mb-2">
                              Join with Code
                            </h3>
                            <p className="text-white/70">
                              Enter your partner's room code
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enhanced Desktop Rooms List */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">
                        Your Rooms
                      </h2>
                      <Badge
                        variant="outline"
                        className="text-white/70 border-white/30 px-4 py-2 text-sm"
                      >
                        {rooms.length} room{rooms.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {loading ? (
                      <div className="grid gap-6">
                        {[1, 2, 3].map((i) => (
                          <Card
                            key={i}
                            className="bg-white/10 backdrop-blur-xl border-white/20 shadow-lg"
                          >
                            <CardContent className="p-8">
                              <div className="animate-pulse">
                                <div className="flex items-center space-x-6">
                                  <div className="h-16 w-16 bg-white/20 rounded-full"></div>
                                  <div className="flex-1 space-y-3">
                                    <div className="h-5 bg-white/20 rounded w-3/4"></div>
                                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : rooms.length === 0 ? (
                      <Card className="bg-white/10 backdrop-blur-xl border-white/20 border-dashed shadow-lg">
                        <CardContent className="p-16 text-center">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 mx-auto mb-8">
                            <MessageCircle className="h-10 w-10 text-white/50" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-4">
                            No rooms yet
                          </h3>
                          <p className="text-white/70 mb-10 text-lg max-w-md mx-auto leading-relaxed">
                            Create your first private room to start chatting
                            securely with your loved ones
                          </p>
                          <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg px-8 py-4 rounded-xl font-semibold text-lg"
                          >
                            <Plus className="h-5 w-5 mr-3" />
                            Create Room
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-6">
                        {rooms.map((room) => (
                          <Card
                            key={room._id}
                            className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group shadow-lg"
                            onClick={() => onSelectRoom(room._id)}
                          >
                            <CardContent className="p-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6 flex-1 min-w-0">
                                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-rose-100/20 to-pink-100/20 group-hover:from-rose-200/30 group-hover:to-pink-200/30 transition-colors shadow-lg">
                                    <Heart className="h-8 w-8 text-rose-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white mb-2 text-xl">
                                      {room.name}
                                    </h3>
                                    {room.lastMessage && (
                                      <p className="text-white/70 truncate mb-1">
                                        {encryption
                                          .decrypt(room.lastMessage?.content)
                                          .substring(0, 50)}
                                      </p>
                                    )}
                                    <p className="text-sm text-white/50">
                                      {room.lastActivity
                                        ? new Date(
                                            room.lastActivity
                                          ).toLocaleString()
                                        : "No activity"}
                                    </p>
                                  </div>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyCode(room.code);
                                  }}
                                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-4 py-3"
                                >
                                  {copiedCode === room.code ? (
                                    <Check className="h-5 w-5 text-green-400" />
                                  ) : (
                                    <Copy className="h-5 w-5" />
                                  )}
                                  <span className="ml-3 font-mono">
                                    {room.code}
                                  </span>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>
      {/* Enhanced Desktop Layout */}

      {/* Enhanced Create Room Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md w-[90%] bg-white/10 backdrop-blur-xl border-white/20 text-white mx-0 shadow-2xl rounded-2xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span>Create Private Room</span>
            </DialogTitle>
            <DialogDescription className="text-white/70 text-base leading-relaxed">
              Create a secure space for you and your partner to chat privately
              with end-to-end encryption.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="room-name" className="text-white font-medium">
                Room Name
              </Label>
              <Input
                id="room-name"
                placeholder="e.g., 'Our Love Nest 💕'"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 rounded-xl h-12 px-4"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 rounded-xl px-6 py-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRoom}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg rounded-xl px-6 py-3 font-semibold"
              disabled={!roomName.trim()}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Join Room Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-md w-[90%] bg-white/10 backdrop-blur-xl border-white/20 text-white mx-0 shadow-2xl rounded-2xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500">
                <Key className="h-5 w-5 text-white" />
              </div>
              <span>Join Private Room</span>
            </DialogTitle>
            <DialogDescription className="text-white/70 text-base leading-relaxed">
              Enter the room code shared by your partner to join their private
              room and start chatting securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="room-code" className="text-white font-medium">
                Room Code
              </Label>
              <Input
                id="room-code"
                placeholder="Enter 6-character code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 font-mono text-center text-lg tracking-widest rounded-xl h-12 px-4"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowJoinModal(false)}
              className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 rounded-xl px-6 py-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinRoom}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg rounded-xl px-6 py-3 font-semibold"
              disabled={!roomCode.trim()}
            >
              <Key className="h-5 w-5 mr-2" />
              Join Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
