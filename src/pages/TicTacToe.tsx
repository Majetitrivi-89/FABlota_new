
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Player = "X" | "O" | null;

const TicTacToe = () => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player | "Draw">(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const { toast } = useToast();

  const checkWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const winInfo = checkWinner(newBoard);
    if (winInfo) {
      setWinner(winInfo.winner as Player);
      setWinningLine(winInfo.line);
      toast({
        title: "Game Over!",
        description: `Player ${winInfo.winner} wins the game! 🎉`,
      });
    } else if (!newBoard.includes(null)) {
      setWinner("Draw");
      toast({
        title: "Game Over!",
        description: "It's a Draw! 🤝",
      });
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
        {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-2 text-gradient-gold font-playfair">Tic Tac Toe</h1>
        <p className="text-muted-foreground font-dm-sans">
          {winner
            ? winner === "Draw"
              ? "It's a Draw!"
              : `Winner: Player ${winner}`
            : `Next Player: ${isXNext ? "X" : "O"}`}
        </p>
      </motion.div>

      <Card className="glass-card p-6 rounded-2xl shadow-elevated relative z-10 border-primary/20">
        <div className="grid grid-cols-3 gap-3">
          {board.map((cell, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="outline"
                className={`w-20 h-20 sm:w-24 sm:h-24 text-3xl sm:text-4xl font-bold relative overflow-hidden transition-all duration-300
                  ${winningLine?.includes(index) ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "hover:bg-accent/10 hover:border-accent/50"}
                  ${!cell && !winner ? "cursor-pointer" : "cursor-default"}
                  border-2
                `}
                onClick={() => handleClick(index)}
              >
                <AnimatePresence mode="wait">
                  {cell && (
                    <motion.span
                      key={cell}
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 45 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={cell === "X" ? "text-primary drop-shadow-md" : "text-white drop-shadow-md"}
                    >
                      {cell}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          ))}
        </div>
      </Card>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 z-10"
      >
        <Button 
            onClick={resetGame} 
            size="lg" 
            className="group bg-gradient-gold hover:opacity-90 text-primary-foreground font-semibold shadow-gold transition-all duration-300"
        >
          <RotateCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          Play Again
        </Button>
      </motion.div>
      
       {winner && winner !== "Draw" && (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute z-50 pointer-events-none"
        >
             <Trophy className="w-64 h-64 text-yellow-500/20" />
        </motion.div>
       )}
    </div>
  );
};

export default TicTacToe;
