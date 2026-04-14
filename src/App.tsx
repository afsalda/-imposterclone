import { useGameStore } from "./store/useGameStore";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Play, LogIn, Plus, ArrowRight, Trophy, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// --- Components ---

const Splash = ({ onStart }: { onStart: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-vibrant-bg text-vibrant-text"
  >
    <motion.h1 
      initial={{ y: -20 }}
      animate={{ y: 0 }}
      className="text-8xl font-black tracking-tighter mb-2 uppercase italic text-vibrant-border drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
    >
      BLUFF IT<span className="text-vibrant-accent-2">!</span>
    </motion.h1>
    <p className="text-vibrant-text mb-8 text-xl font-black uppercase tracking-widest opacity-60">The ultimate social deduction game</p>
    <Button 
      size="lg" 
      onClick={onStart}
      className="bg-vibrant-accent-1 text-white hover:bg-vibrant-accent-1/90 font-black text-2xl px-16 py-10 rounded-2xl vibrant-button transition-all hover:scale-105"
    >
      PLAY NOW
    </Button>
  </motion.div>
);

const Home = () => {
  const { createRoom, createLocalRoom, joinRoom, playerName, setPlayerName, error, setError } = useGameStore();
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  return (
    <div className="min-h-screen bg-vibrant-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md vibrant-card overflow-hidden">
        <CardHeader className="bg-vibrant-accent-1 text-white p-8 border-b-3 border-vibrant-border">
          <CardTitle className="text-4xl font-black uppercase tracking-tight">Welcome!</CardTitle>
          <CardDescription className="text-white/80 font-bold uppercase text-xs tracking-widest">Choose how you want to play</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-vibrant-text uppercase tracking-widest">Your Nickname</label>
            <Input 
              placeholder="e.g. FakerMaster" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)}
              className="h-14 text-lg rounded-xl vibrant-input font-bold"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4">
            <Button 
              disabled={!playerName}
              onClick={() => createRoom(playerName)}
              className="h-16 rounded-2xl bg-vibrant-accent-1 hover:bg-vibrant-accent-1/90 text-xl font-black vibrant-button"
            >
              <Plus className="mr-2 h-6 w-6" /> Create Online Room
            </Button>

            <Button 
              onClick={() => createLocalRoom()}
              className="h-16 rounded-2xl bg-vibrant-accent-3 hover:bg-vibrant-accent-3/90 text-xl font-black vibrant-button text-vibrant-text"
            >
              <Users className="mr-2 h-6 w-6" /> Local Pass & Play
            </Button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t-3 border-vibrant-border/10"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-vibrant-text/40 font-black">OR JOIN ONLINE</span></div>
            </div>

            <div className="flex gap-3">
              <Input 
                placeholder="ROOM CODE" 
                value={roomId} 
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="h-16 text-center font-black text-2xl tracking-widest rounded-2xl vibrant-input"
              />
              <Button 
                disabled={!playerName || roomId.length < 4}
                onClick={() => joinRoom(roomId, playerName)}
                className="h-16 w-16 rounded-2xl bg-vibrant-accent-2 hover:bg-vibrant-accent-2/90 vibrant-button p-0 flex-shrink-0"
              >
                <ArrowRight className="h-8 w-8 text-white" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Lobby = () => {
  const { room, socket, startGame, addLocalPlayer, removeLocalPlayer } = useGameStore();
  const [newPlayerName, setNewPlayerName] = useState("");
  if (!room) return null;

  const isHost = room.gameMode === "local" || room.players.find(p => p.id === socket?.id)?.isHost;

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addLocalPlayer(newPlayerName.trim());
      setNewPlayerName("");
    }
  };

  return (
    <div className="min-h-screen bg-vibrant-bg p-6 flex flex-col max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="bg-white border-3 border-vibrant-border px-6 py-3 rounded-2xl shadow-vibrant-sm">
          <h2 className="text-vibrant-text font-black text-xs uppercase tracking-widest opacity-50">
            {room.gameMode === "local" ? "Local Game" : "Room Code"}
          </h2>
          <p className="text-3xl font-black text-vibrant-accent-1 tracking-widest">{room.id}</p>
        </div>
        <Badge className="px-6 py-3 rounded-full text-xl font-black bg-vibrant-accent-2 text-white border-3 border-vibrant-border shadow-vibrant-sm">
          <Users className="mr-2 h-6 w-6" /> {room.players.length}/10
        </Badge>
      </div>

      <Card className="flex-1 vibrant-card overflow-hidden flex flex-col mb-6">
        <CardHeader className="bg-white border-b-3 border-vibrant-border p-6">
          <CardTitle className="text-2xl font-black text-vibrant-text uppercase tracking-tight">Players in Lobby</CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {room.gameMode === "local" && (
              <div className="flex gap-3 mb-6">
                <Input 
                  placeholder="Enter Player Name" 
                  value={newPlayerName} 
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  className="h-14 rounded-xl vibrant-input font-bold"
                />
                <Button 
                  onClick={handleAddPlayer}
                  className="h-14 px-6 rounded-xl bg-vibrant-accent-3 hover:bg-vibrant-accent-3/90 text-vibrant-text font-black vibrant-button"
                >
                  Add
                </Button>
              </div>
            )}
            {room.players.map((player) => (
              <motion.div 
                key={player.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center justify-between p-5 bg-white rounded-2xl border-3 border-vibrant-border shadow-vibrant-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-3 border-vibrant-border bg-vibrant-accent-3 flex items-center justify-center text-vibrant-text font-black text-xl">
                    {player.name[0].toUpperCase()}
                  </div>
                  <span className="font-black text-xl text-vibrant-text">{player.name} {room.gameMode === "online" && player.id === socket?.id && "(You)"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {player.isHost && <Badge className="bg-vibrant-accent-2 text-white border-2 border-vibrant-border font-black">HOST</Badge>}
                  {room.gameMode === "local" && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeLocalPlayer(player.id)}
                      className="text-vibrant-accent-2 hover:bg-vibrant-accent-2/10 p-2 h-auto"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {isHost ? (
        <Button 
          disabled={room.players.length < 3}
          onClick={startGame}
          className="h-20 rounded-2xl bg-vibrant-accent-1 hover:bg-vibrant-accent-1/90 text-2xl font-black vibrant-button text-white"
        >
          <Play className="mr-2 h-8 w-8" /> START GAME
        </Button>
      ) : (
        <div className="p-8 bg-white rounded-3xl border-3 border-vibrant-border shadow-vibrant-sm text-center animate-pulse">
          <p className="text-vibrant-text font-black text-xl uppercase tracking-widest">Waiting for host to start...</p>
        </div>
      )}
    </div>
  );
};

const RoleReveal = () => {
  const { room, socket, localPlayerId, setLocalPlayerId, nextPhase } = useGameStore();
  const [show, setShow] = useState(false);
  const [passing, setPassing] = useState(room?.gameMode === "local");
  if (!room) return null;

  const currentPlayerId = room.gameMode === "local" ? localPlayerId : socket?.id;
  const isFaker = room.fakerId === currentPlayerId;
  const isHost = room.gameMode === "local" || room.players.find(p => p.id === socket?.id)?.isHost;
  const player = room.players.find(p => p.id === currentPlayerId);

  const handleContinue = () => {
    if (room.gameMode === "local") {
      const currentIndex = room.players.findIndex(p => p.id === localPlayerId);
      if (currentIndex < room.players.length - 1) {
        setLocalPlayerId(room.players[currentIndex + 1].id);
        setShow(false);
        setPassing(true);
      } else {
        nextPhase();
      }
    } else {
      nextPhase();
    }
  };

  if (passing) {
    return (
      <div className="min-h-screen bg-vibrant-bg p-6 flex flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-10 w-full max-w-md">
          <div className="space-y-4">
            <p className="text-vibrant-text font-black uppercase tracking-widest opacity-60">Pass the device to</p>
            <h2 className="text-7xl font-black text-vibrant-text uppercase italic tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
              {player?.name}
            </h2>
          </div>
          <Button 
            onClick={() => setPassing(false)}
            className="w-full h-24 rounded-3xl bg-vibrant-accent-1 text-white text-3xl font-black vibrant-button"
          >
            I AM {player?.name}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vibrant-text flex flex-col items-center justify-center p-6 text-white text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <h2 className="text-vibrant-accent-3 font-black uppercase tracking-widest mb-6 text-xl">YOUR ROLE</h2>
        
        <Card className="bg-white text-vibrant-text border-4 border-vibrant-border rounded-3xl p-12 mb-10 shadow-vibrant relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!show ? (
              <motion.div 
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-8"
              >
                <div className="w-28 h-28 rounded-full border-4 border-vibrant-border bg-vibrant-bg flex items-center justify-center shadow-vibrant-sm">
                  <EyeOff className="h-14 w-14 text-vibrant-text" />
                </div>
                <p className="text-2xl font-black uppercase tracking-tight">Tap to reveal your secret role</p>
                <Button 
                  onClick={() => setShow(true)}
                  className="bg-vibrant-accent-1 text-white hover:bg-vibrant-accent-1/90 font-black text-xl px-10 py-8 rounded-2xl vibrant-button"
                >
                  REVEAL
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="revealed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-8"
              >
                {isFaker ? (
                  <>
                    <div className="text-8xl mb-4">🎭</div>
                    <h3 className="text-5xl font-black text-vibrant-accent-2 uppercase tracking-tighter">YOU ARE THE FAKER</h3>
                    <p className="text-vibrant-text/60 font-bold uppercase text-sm tracking-widest">You don't know the word. Blend in and don't get caught!</p>
                  </>
                ) : (
                  <>
                    <div className="text-8xl mb-4">🔍</div>
                    <h3 className="text-5xl font-black text-vibrant-accent-3 uppercase tracking-tighter">YOU ARE IN</h3>
                    <div className="space-y-3">
                      <p className="text-vibrant-text/40 uppercase text-xs font-black tracking-widest">Category: {room.category}</p>
                      <p className="text-6xl font-black text-vibrant-accent-1 tracking-tight uppercase">{room.secretWord}</p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {isHost && show && (
          <Button 
            onClick={handleContinue}
            className="w-full h-20 rounded-2xl bg-vibrant-bg text-vibrant-text hover:bg-vibrant-bg/90 text-2xl font-black vibrant-button"
          >
            {room.gameMode === "local" && room.players.findIndex(p => p.id === localPlayerId) < room.players.length - 1 ? "NEXT PLAYER" : "CONTINUE"} <ArrowRight className="ml-2 h-8 w-8" />
          </Button>
        )}
      </motion.div>
    </div>
  );
};

const ClueRound = () => {
  const { room, socket, localPlayerId, submitClue } = useGameStore();
  const [clue, setClue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [passing, setPassing] = useState(room?.gameMode === "local");
  if (!room) return null;

  const currentPlayerId = room.gameMode === "local" ? localPlayerId : socket?.id;
  const isFaker = room.fakerId === currentPlayerId;
  const hasSubmitted = room.clues.some(c => c.playerId === currentPlayerId);
  const player = room.players.find(p => p.id === currentPlayerId);

  const handleSubmit = () => {
    if (!clue.trim()) return;
    submitClue(clue);
    setClue("");
    if (room.gameMode === "local") {
      setSubmitted(false);
      setPassing(true);
    } else {
      setSubmitted(true);
    }
  };

  if (passing) {
    return (
      <div className="min-h-screen bg-vibrant-bg p-6 flex flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-10 w-full max-w-md">
          <div className="space-y-4">
            <p className="text-vibrant-text font-black uppercase tracking-widest opacity-60">Pass the device to</p>
            <h2 className="text-7xl font-black text-vibrant-text uppercase italic tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
              {player?.name}
            </h2>
          </div>
          <Button 
            onClick={() => setPassing(false)}
            className="w-full h-24 rounded-3xl bg-vibrant-accent-1 text-white text-3xl font-black vibrant-button"
          >
            I AM {player?.name}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vibrant-bg p-6 flex flex-col max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-vibrant-text font-black text-xs uppercase tracking-widest opacity-50">Clue Round</h2>
        <div className="flex justify-between items-end">
          <p className="text-4xl font-black text-vibrant-text uppercase tracking-tight">Give your clue</p>
          {!isFaker && <Badge className="bg-vibrant-accent-1 text-white border-2 border-vibrant-border px-4 py-1 font-black mb-1 uppercase">{room.secretWord}</Badge>}
        </div>
        {room.gameMode === "local" && <p className="text-vibrant-accent-1 font-black uppercase tracking-widest mt-2">{player?.name}'s Turn</p>}
      </div>

      <Card className="vibrant-card p-8 mb-8">
        {hasSubmitted || submitted ? (
          <div className="text-center py-12 space-y-6">
            <div className="w-24 h-24 rounded-full border-4 border-vibrant-border bg-vibrant-accent-3 flex items-center justify-center mx-auto shadow-vibrant-sm">
              <Play className="h-12 w-12 text-vibrant-text" />
            </div>
            <h3 className="text-3xl font-black text-vibrant-text uppercase">Clue Submitted!</h3>
            <p className="text-vibrant-text/60 font-bold uppercase text-sm tracking-widest">Waiting for other players to finish...</p>
            <div className="flex justify-center gap-3 mt-6">
              {room.players.map(p => {
                const finished = room.clues.some(c => c.playerId === p.id);
                return (
                  <div 
                    key={p.id} 
                    className={`w-4 h-4 rounded-full border-2 border-vibrant-border ${finished ? 'bg-vibrant-accent-3' : 'bg-white'}`} 
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-vibrant-text font-bold text-lg leading-tight">
              {isFaker 
                ? "You don't know the word! Try to give a clue that sounds like you do." 
                : "Give a clue that is related to the secret word, but don't make it too obvious!"}
            </p>
            <Input 
              placeholder="Enter one word or phrase..." 
              value={clue}
              onChange={(e) => setClue(e.target.value)}
              className="h-20 text-2xl font-black rounded-2xl vibrant-input px-6"
            />
            <Button 
              disabled={!clue.trim()}
              onClick={handleSubmit}
              className="w-full h-20 rounded-2xl bg-vibrant-accent-1 hover:bg-vibrant-accent-1/90 text-2xl font-black vibrant-button text-white"
            >
              SUBMIT CLUE
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <h4 className="text-xs font-black text-vibrant-text uppercase tracking-widest opacity-50">Live Clue Board</h4>
        <div className="grid grid-cols-1 gap-4">
          {room.clues.map((c, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-white rounded-2xl border-3 border-vibrant-border shadow-vibrant-sm flex justify-between items-center"
            >
              <span className="font-black text-vibrant-text uppercase text-sm tracking-widest opacity-60">{c.playerName}</span>
              <span className="text-vibrant-accent-1 font-black text-2xl italic uppercase">"{c.text}"</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Discussion = () => {
  const { room, socket, nextPhase } = useGameStore();
  if (!room) return null;

  const isHost = room.players.find(p => p.id === socket?.id)?.isHost;

  return (
    <div className="min-h-screen bg-vibrant-bg p-6 flex flex-col max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-vibrant-text font-black text-xs uppercase tracking-widest opacity-50">Discussion</h2>
        <p className="text-5xl font-black text-vibrant-text uppercase tracking-tight">Who is the Faker?</p>
      </div>

      <ScrollArea className="flex-1 mb-8 pr-4">
        <div className="grid grid-cols-1 gap-5">
          {room.clues.map((c, i) => (
            <Card key={i} className="rounded-2xl border-3 border-vibrant-border shadow-vibrant-sm overflow-hidden">
              <div className="flex">
                <div className="w-20 bg-vibrant-accent-1 flex items-center justify-center text-white font-black text-3xl border-r-3 border-vibrant-border">
                  {i + 1}
                </div>
                <div className="p-5 flex-1 bg-white">
                  <p className="text-xs font-black text-vibrant-text uppercase mb-1 opacity-40 tracking-widest">{c.playerName}</p>
                  <p className="text-2xl font-black text-vibrant-text italic uppercase">"{c.text}"</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="space-y-6">
        <div className="p-8 bg-white rounded-3xl border-3 border-vibrant-border shadow-vibrant-sm text-center">
          <p className="text-vibrant-text font-black text-lg uppercase tracking-tight">Discuss the clues and prepare to vote!</p>
        </div>

        {isHost && (
          <Button 
            onClick={nextPhase}
            className="w-full h-20 rounded-2xl bg-vibrant-accent-1 hover:bg-vibrant-accent-1/90 text-2xl font-black vibrant-button text-white"
          >
            GO TO VOTE <ArrowRight className="ml-2 h-8 w-8" />
          </Button>
        )}
      </div>
    </div>
  );
};

const Vote = () => {
  const { room, socket, localPlayerId, setLocalPlayerId, submitVote, nextPhase } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [passing, setPassing] = useState(room?.gameMode === "local");
  if (!room) return null;

  const currentPlayerId = room.gameMode === "local" ? localPlayerId : socket?.id;
  const player = room.players.find(p => p.id === currentPlayerId);
  const isHost = room.gameMode === "local" || room.players.find(p => p.id === socket?.id)?.isHost;
  const hasVoted = !!room.votes[currentPlayerId || ""];

  const handleVote = () => {
    if (selectedId) {
      submitVote(selectedId);
      setSelectedId(null);
      if (room.gameMode === "local") {
        setPassing(true);
      }
    }
  };

  if (passing) {
    const nextPlayerIndex = room.players.findIndex(p => p.id === localPlayerId);
    const nextPlayer = room.players[nextPlayerIndex];
    if (!nextPlayer) return null;

    return (
      <div className="min-h-screen bg-vibrant-bg p-6 flex flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-10 w-full max-w-md">
          <div className="space-y-4">
            <p className="text-vibrant-text font-black uppercase tracking-widest opacity-60">Pass the device to</p>
            <h2 className="text-7xl font-black text-vibrant-text uppercase italic tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
              {nextPlayer.name}
            </h2>
          </div>
          <Button 
            onClick={() => setPassing(false)}
            className="w-full h-24 rounded-3xl bg-vibrant-accent-1 text-white text-3xl font-black vibrant-button"
          >
            I AM {nextPlayer.name}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vibrant-bg p-6 flex flex-col max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-vibrant-text font-black text-xs uppercase tracking-widest opacity-50">Voting</h2>
        <p className="text-5xl font-black text-vibrant-text uppercase tracking-tight">Cast your vote</p>
        {room.gameMode === "local" && <p className="text-vibrant-accent-1 font-black uppercase tracking-widest mt-2">{player?.name}'s Turn</p>}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-5 mb-8">
        {room.players.map((p) => (
          <button
            key={p.id}
            disabled={hasVoted || p.id === currentPlayerId}
            onClick={() => setSelectedId(p.id)}
            className={`
              p-8 rounded-3xl border-3 transition-all flex flex-col items-center justify-center gap-4 shadow-vibrant-sm
              ${p.id === currentPlayerId ? 'opacity-40 cursor-not-allowed bg-white/50 border-vibrant-border/20' : ''}
              ${selectedId === p.id ? 'border-vibrant-border bg-vibrant-accent-1 text-white scale-105' : 'border-vibrant-border bg-white text-vibrant-text'}
              ${hasVoted && room.votes[currentPlayerId || ""] === p.id ? 'border-vibrant-border bg-vibrant-accent-3 text-vibrant-text' : ''}
            `}
          >
            <div className={`w-16 h-16 rounded-full border-3 border-vibrant-border flex items-center justify-center font-black text-2xl ${selectedId === p.id ? 'bg-white text-vibrant-accent-1' : 'bg-vibrant-bg text-vibrant-text'}`}>
              {p.name[0].toUpperCase()}
            </div>
            <span className="font-black text-xl uppercase tracking-tight">{p.name}</span>
            {hasVoted && room.votes[currentPlayerId || ""] === p.id && <Badge className="bg-vibrant-border text-white font-black border-none">VOTED</Badge>}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {!hasVoted ? (
          <Button 
            disabled={!selectedId}
            onClick={handleVote}
            className="w-full h-20 rounded-2xl bg-vibrant-accent-1 hover:bg-vibrant-accent-1/90 text-2xl font-black vibrant-button text-white"
          >
            CONFIRM VOTE
          </Button>
        ) : (
          <div className="text-center p-8 bg-white rounded-3xl border-3 border-vibrant-border shadow-vibrant-sm">
            <p className="text-vibrant-text font-black text-lg uppercase tracking-widest">Waiting for others to vote... ({Object.keys(room.votes).length}/{room.players.length})</p>
          </div>
        )}

        {isHost && Object.keys(room.votes).length === room.players.length && (
          <Button 
            onClick={nextPhase}
            className="w-full h-20 rounded-2xl bg-vibrant-accent-3 hover:bg-vibrant-accent-3/90 text-2xl font-black vibrant-button text-vibrant-text"
          >
            REVEAL RESULTS <ArrowRight className="ml-2 h-8 w-8" />
          </Button>
        )}
      </div>
    </div>
  );
};

const FakerGuess = () => {
  const { room, socket, submitFakerGuess } = useGameStore();
  const [guess, setGuess] = useState("");
  if (!room) return null;

  const currentPlayerId = room.gameMode === "local" ? room.fakerId : socket?.id;
  const isFaker = room.fakerId === currentPlayerId;

  return (
    <div className="min-h-screen bg-vibrant-accent-2 p-6 flex flex-col items-center justify-center text-white text-center">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md space-y-10"
      >
        <div className="space-y-3">
          <h2 className="text-white font-black uppercase tracking-widest opacity-60">Faker Caught!</h2>
          <p className="text-7xl font-black tracking-tighter uppercase italic drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">LAST CHANCE</p>
        </div>

        <Card className="bg-white text-vibrant-text border-4 border-vibrant-border rounded-3xl p-10 space-y-8 shadow-vibrant">
          {isFaker ? (
            <>
              <p className="text-2xl font-black uppercase tracking-tight leading-tight">You were caught! But if you can guess the secret word, you still win!</p>
              <div className="space-y-6">
                <p className="text-vibrant-accent-1 text-sm font-black uppercase tracking-widest">Category: {room.category}</p>
                <Input 
                  placeholder="Type the secret word..." 
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  className="h-20 text-center text-3xl font-black uppercase bg-vibrant-bg border-3 border-vibrant-border text-vibrant-text placeholder:text-vibrant-text/30 rounded-2xl"
                />
                <Button 
                  disabled={!guess.trim()}
                  onClick={() => submitFakerGuess(guess)}
                  className="w-full h-20 rounded-2xl bg-vibrant-accent-1 text-white hover:bg-vibrant-accent-1/90 text-2xl font-black vibrant-button"
                >
                  SUBMIT GUESS
                </Button>
              </div>
            </>
          ) : (
            <div className="py-12 space-y-6">
              <div className="w-28 h-28 rounded-full border-4 border-vibrant-border bg-vibrant-accent-2 flex items-center justify-center mx-auto shadow-vibrant-sm animate-pulse">
                <AlertCircle className="h-14 w-14 text-white" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight">The Faker is guessing...</h3>
              <p className="text-vibrant-text/60 font-bold uppercase text-sm tracking-widest">If they guess "{room.secretWord}", they steal the win!</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

const RoundEnd = () => {
  const { room, socket, playAgain } = useGameStore();
  if (!room) return null;

  const isHost = room.gameMode === "local" || room.players.find(p => p.id === socket?.id)?.isHost;
  const faker = room.players.find(p => p.id === room.fakerId);

  return (
    <div className={`min-h-screen p-6 flex flex-col items-center justify-center text-white text-center ${room.winner === 'faker' ? 'bg-vibrant-accent-2' : 'bg-vibrant-accent-3'}`}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md space-y-10"
      >
        <div className="space-y-3">
          <h2 className="text-white font-black uppercase tracking-widest opacity-60">Round Finished</h2>
          <p className="text-7xl font-black tracking-tighter uppercase italic drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
            {room.winner === 'faker' ? 'FAKER WINS!' : 'GROUP WINS!'}
          </p>
        </div>

        <Card className="bg-white text-vibrant-text border-4 border-vibrant-border rounded-3xl p-10 space-y-8 shadow-vibrant">
          <div className="space-y-2">
            <p className="text-vibrant-text/40 text-xs font-black uppercase tracking-widest">The Secret Word Was</p>
            <p className="text-5xl font-black uppercase tracking-tight text-vibrant-accent-1">{room.secretWord}</p>
          </div>

          <div className="space-y-2">
            <p className="text-vibrant-text/40 text-xs font-black uppercase tracking-widest">The Faker Was</p>
            <p className="text-3xl font-black uppercase tracking-tight">{faker?.name}</p>
          </div>

          {room.fakerGuess && (
            <div className="space-y-2">
              <p className="text-vibrant-text/40 text-xs font-black uppercase tracking-widest">Faker's Guess</p>
              <p className={`text-3xl font-black italic uppercase ${room.winner === 'faker' ? 'text-vibrant-accent-3' : 'text-vibrant-accent-2'}`}>
                "{room.fakerGuess}"
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-6 w-full">
          <Card className="bg-white rounded-3xl p-8 border-4 border-vibrant-border shadow-vibrant">
            <h3 className="text-vibrant-text font-black text-2xl uppercase tracking-tight mb-6 flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8 text-vibrant-bg drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" /> Leaderboard
            </h3>
            <div className="space-y-3 text-left">
              {room.players.sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-vibrant-bg/10 rounded-2xl border-2 border-vibrant-border">
                  <div className="flex items-center gap-4">
                    <span className="text-vibrant-text font-black w-6 text-xl">{i + 1}</span>
                    <span className="font-black text-xl text-vibrant-text uppercase tracking-tight">{p.name}</span>
                  </div>
                  <Badge className="bg-vibrant-accent-1 text-white border-2 border-vibrant-border font-black px-4 py-1">{p.score} pts</Badge>
                </div>
              ))}
            </div>
          </Card>

          {isHost && (
            <Button 
              onClick={playAgain}
              className="w-full h-20 rounded-2xl bg-vibrant-bg text-vibrant-text hover:bg-vibrant-bg/90 text-2xl font-black vibrant-button"
            >
              PLAY AGAIN
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const { room, connect, room: currentRoom } = useGameStore();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    connect();
  }, [connect]);

  if (!started) return <Splash onStart={() => setStarted(true)} />;
  if (!currentRoom) return <Home />;

  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen">
      <AnimatePresence mode="wait">
        {currentRoom.status === "lobby" && <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Lobby /></motion.div>}
        {currentRoom.status === "role_reveal" && <motion.div key="role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><RoleReveal /></motion.div>}
        {currentRoom.status === "clue_round" && <motion.div key="clue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ClueRound /></motion.div>}
        {currentRoom.status === "discussion" && <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Discussion /></motion.div>}
        {currentRoom.status === "vote" && <motion.div key="vote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Vote /></motion.div>}
        {currentRoom.status === "faker_guess" && <motion.div key="guess" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><FakerGuess /></motion.div>}
        {currentRoom.status === "round_end" && <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><RoundEnd /></motion.div>}
      </AnimatePresence>
      <Toaster position="top-center" />
    </div>
  );
}
