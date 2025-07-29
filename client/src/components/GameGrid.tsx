import React from 'react';
import GameCard from './GameCard';
import { Gamepad2, Zap, Target, Puzzle, Brain, Trees, Crown, Apple } from 'lucide-react';
import { useLocation } from 'wouter';

interface GameGridProps {
  setActiveTab?: (tab: 'games' | 'leaderboard' | 'profile' | 'admin') => void;
}

const GameGrid: React.FC<GameGridProps> = ({ setActiveTab }) => {
  const [location, setLocation] = useLocation();
  const games = [

    {
      id: 2,
      title: 'تحدي السرعة',
      description: 'اختبر سرعة ردود أفعالك في هذا التحدي المثير',
      image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=800',
      players: 8930,
      rating: 4,
      onPlay: () => window.open('/speed-challenge.html', '_blank')
    },
    {
      id: 3,
      title: 'ألغاز العقل',
      description: 'حل الألغاز المعقدة واكسب النقاط والجوائز',
      image: 'https://images.pexels.com/photos/1040157/pexels-photo-1040157.jpeg?auto=compress&cs=tinysrgb&w=800',
      players: 12150,
      rating: 4,
      onPlay: () => window.open('/mind-puzzles.html', '_blank')
    },
    {
      id: 4,
      title: 'صناديق الحظ',
      description: 'اكسر الصناديق واجمع الكنوز والجواهر في لعبة صناديق الحظ المثيرة',
      image: 'https://images.pexels.com/photos/3258/boxes-wooden-crates-market.jpg?auto=compress&cs=tinysrgb&w=800',
      players: 6780,
      rating: 5,
      onPlay: () => window.open('/game8.html', '_blank')
    },
    {
      id: 5,
      title: 'مغامرة الكنوز',
      description: 'انطلق في رحلة البحث عن الكنوز المفقودة',
      image: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=800',
      players: 6780,
      rating: 5,
      onPlay: () => console.log('مغامرة الكنوز')
    },
    {
      id: 6,
      title: 'بطولة النجوم',
      description: 'تنافس مع أفضل اللاعبين في البطولة الكبرى',
      image: 'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg?auto=compress&cs=tinysrgb&w=800',
      players: 25600,
      rating: 5,
      onPlay: () => setLocation('/game')
    },
    {
      id: 7,
      title: 'عالم الخيال',
      description: 'استكشف عوالم خيالية مليئة بالمغامرات والأسرار',
      image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800',
      players: 18900,
      rating: 4,
      onPlay: () => console.log('عالم الخيال')
    }
  ];

  const gameHallGames = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'تحدي السرعة',
      description: 'اختبر سرعة ردود أفعالك في تحدي مثير',
      color: 'from-yellow-500 to-orange-500',
      onClick: () => window.open('/speed-challenge.html', '_blank')
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'صناديق الحظ',
      description: 'اكسر الصناديق واجمع الكنوز والجواهر',
      color: 'from-green-500 to-emerald-500',
      onClick: () => window.open('/game8.html', '_blank')
    },
    {
      icon: <Puzzle className="w-8 h-8" />,
      title: 'ألغاز العقل',
      description: 'حل الألغاز المعقدة واختبر ذكاءك',
      color: 'from-blue-500 to-cyan-500',
      onClick: () => window.open('/mind-puzzles.html', '_blank')
    },
    {
      icon: <Apple className="w-8 h-8" />,
      title: 'قطف الفواكه',
      description: 'اقطف الفواكه الساقطة واجمع النقاط',
      color: 'from-red-500 to-yellow-500',
      onClick: () => window.open('/fruit-catching.html', '_blank')
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'لعبة الذاكرة',
      description: 'اختبر ذاكرتك وطابق البطاقات',
      color: 'from-purple-500 to-pink-500',
      onClick: () => window.open('/memory-match.html', '_blank')
    },
    {
      icon: <Trees className="w-8 h-8" />,
      title: 'لعبة الغابة',
      description: 'اكتشف الحيوانات وتعلم أسماءها',
      color: 'from-green-600 to-emerald-600',
      onClick: () => window.open('/forest-game.html', '_blank')
    }
  ];





  return (
    <div className="space-y-8">
      {/* القاعات الرئيسية - ثلاثة أقسام */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* قاعة الألعاب */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-300 to-blue-300 bg-clip-text text-transparent">قاعة الألعاب</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {gameHallGames.map((game, index) => (
              <button
                key={index}
                onClick={game.onClick}
                className="group p-2 sm:p-3 crystal-game-card rounded-xl text-center"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r ${game.color} rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto shadow-lg ring-4 ring-white/20`}>
                  {game.icon}
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">{game.title}</h3>
                <p className="text-gray-300 text-xs leading-tight">{game.description}</p>
              </button>
            ))}
          </div>
        </section>

      </div>


    </div>
  );
};

export default GameGrid;