import React, { useState, useEffect } from 'react';
import { User, PVPGame, GameRound } from '../types';
import { getPVPGames, createPVPGame, joinPVPGame, updatePVPGameRound } from '../services/gameService';
import GameArena from './GameArena';
import Spinner from './Spinner';

interface PvPPageProps {
  user: User;
}

const PvPPage: React.FC<PvPPageProps> = ({ user }) => {
  const [games, setGames] = useState<PVPGame[]>([]);
  const [activeGame, setActiveGame] = useState<PVPGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGames();
    const interval = setInterval(loadGames, 5000); // Poll for game updates
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
      // If we are in an active game, make sure our local state is up-to-date
      if (activeGame) {
          const currentGames = getPVPGames();
          const updatedGame = currentGames.find(g => g.id === activeGame.id);
          if (updatedGame) {
              setActiveGame(updatedGame);
          }
      }
  }, [games, activeGame]);

  const loadGames = () => {
    setIsLoading(true);
    setGames(getPVPGames());
    setIsLoading(false);
  };

  const handleCreateGame = () => {
    const newGame = createPVPGame(user);
    setActiveGame(newGame);
    loadGames();
  };

  const handleJoinGame = (gameId: string) => {
    const joinedGame = joinPVPGame(gameId, user);
    if (joinedGame) {
      setActiveGame(joinedGame);
      loadGames();
    }
  };
  
  const handleRoundEnd = (round: GameRound) => {
      if(activeGame){
          const updatedGame = updatePVPGameRound(activeGame.id, user, round);
          setActiveGame(updatedGame);
          loadGames();
      }
  };

  if (activeGame) {
      const isPlayer1 = activeGame.player1.email === user.email;
      const myRound = isPlayer1 ? activeGame.player1Round : activeGame.player2Round;
      const opponentRound = isPlayer1 ? activeGame.player2Round : activeGame.player1Round;

      if(activeGame.status === 'finished') {
          return (
              <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl max-w-2xl mx-auto">
                  <h2 className="text-3xl font-bold text-white">Game Over!</h2>
                  <p className="text-xl mt-4">{activeGame.winner === 'draw' ? "It's a draw!" : activeGame.winner === user.email ? "You Won!" : "You Lost."}</p>
                  <div className="mt-6 text-left space-y-2">
                      <p>Your performance: <span className="font-bold">{myRound?.performance.toFixed(2)}%</span></p>
                      <p>Opponent's performance: <span className="font-bold">{opponentRound?.performance.toFixed(2)}%</span></p>
                  </div>
                  <button onClick={() => setActiveGame(null)} className="mt-8 px-6 py-2 bg-blue-600 rounded hover:bg-blue-700">Back to Lobby</button>
              </div>
          )
      }

      if (myRound) {
          return (
              <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-white">Waiting for opponent...</h2>
                  <p className="mt-2 text-gray-400">Your performance was {myRound.performance.toFixed(2)}%.</p>
                  <div className="mt-8"><Spinner/></div>
              </div>
          )
      }

      return <GameArena 
        user={user} 
        onRoundEnd={handleRoundEnd} 
        challengeConfig={{ asset: activeGame.asset, startIndex: activeGame.startIndex }}
        onFirstTrade={() => {}}
        isLocked={false}
      />
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">PvP Lobby</h2>
        <button onClick={handleCreateGame} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold">Create New Game</button>
      </div>
      
      {isLoading ? <Spinner/> : (
        <div className="space-y-4">
          {games.filter(g => g.status === 'waiting').map(game => (
            <div key={game.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">Game by {game.player1.email}</p>
                <p className="text-sm text-gray-400">Asset: {game.asset}</p>
              </div>
              <button onClick={() => handleJoinGame(game.id)} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">Join</button>
            </div>
          ))}
          {games.filter(g => g.status === 'waiting').length === 0 && (
              <p className="text-center text-gray-400 py-8">No open games. Why not create one?</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PvPPage;