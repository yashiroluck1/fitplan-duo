import React, { useState, useEffect } from 'react';
import { Activity, Apple, CheckCircle2, AlertTriangle, Timer, Play, Pause, Users, HeartPulse, ChevronDown, Info, Beaker, LogOut, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Brain } from 'lucide-react';

const YouTubeButton = ({ videoId }) => {
  const openTutorial = () => {
    if (typeof window !== 'undefined') {
      window.open(`https://www.youtube.com/shorts/${videoId}`, '_blank', 'noopener,noreferrer');
    }
  };
  
  if (!videoId) return null;
  return (
    <button onClick={openTutorial} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm mb-4">
      <Play className="w-6 h-6 fill-current" />
      <div className="flex flex-col items-start text-left">
        <span className="font-black text-sm leading-none">Ver Técnica</span>
        <span className="text-[10px] opacity-80 uppercase tracking-wider">YouTube Short</span>
      </div>
    </button>
  );
};

const motivaciones = [
  "Tu cerebro está creando nuevas vías neuronales. ¡La resistencia física construye resiliencia mental!",
  "La dopamina liberada al terminar esta serie fortalecerá tu disciplina para mañana.",
  "Estás reduciendo la actividad de tu amígdala (centro del estrés). Este esfuerzo te da paz mental.",
  "El ardor muscular es tu cerebro adaptándose para hacerte más fuerte e imparable.",
  "Has vencido la resistencia inicial de tu cerebro. ¡Estás en estado de flujo, sigue así!"
];

export default function App() {
  const [activeProfile, setActiveProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('entrenamiento');
  const [activeDay, setActiveDay] = useState(0);
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [useScale, setUseScale] = useState(true);
  
  const [completedSets, setCompletedSets] = useState({}); 
  const [mealSelections, setMealSelections] = useState({});
  const [suppStatus, setSuppStatus] = useState('none'); 
  const [suppType, setSuppType] = useState({ protein: false, creatine: false });
  const [calendarData, setCalendarData] = useState({});

  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('rest'); 
  const [activeWorkSet, setActiveWorkSet] = useState(null);
  
  const [showExertionModal, setShowExertionModal] = useState(false);
  const [currentMotivation, setCurrentMotivation] = useState("");

  const playBeep = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const playTone = (time, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, time);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.00001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      const now = ctx.currentTime;
      playTone(now, 0.4);
      playTone(now + 0.6, 0.4);
      playTone(now + 1.2, 0.6);
    } catch (e) { 
      console.log("Audio no disponible"); 
    }
  };

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      setIsTimerRunning(false);
      playBeep();
      if (timerMode === 'work') {
        const newSets = { ...completedSets, [activeWorkSet.key]: true };
        setCompletedSets(newSets);
        checkAndTriggerExertion(newSets, activeWorkSet.exIdx, activeWorkSet.totalSets);
        setActiveWorkSet(null);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMode, activeWorkSet]);

  useEffect(() => {
    setActiveExerciseIdx(0);
  }, [activeDay]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  
  const resetTimer = (seconds = 60, mode = 'rest') => {
    setTimerMode(mode);
    setIsTimerRunning(mode === 'rest');
    setTimeLeft(seconds);
    if (mode === 'rest') setActiveWorkSet(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const checkAndTriggerExertion = (newSets, exIdx, totalSets) => {
    let allDone = true;
    for (let i = 0; i < totalSets; i++) {
      if (!newSets[`${activeProfile}-${activeDay}-${exIdx}-${i}`]) {
        allDone = false; break;
      }
    }
    
    if (allDone) {
      setCurrentMotivation(motivaciones[Math.floor(Math.random() * motivaciones.length)]);
      setShowExertionModal(true);
    } else {
      resetTimer(60, 'rest');
    }
  };

  const handleExertionResponse = (restTime) => {
    setShowExertionModal(false);
    resetTimer(restTime, 'rest');
    
    const currentPlan = profiles[activeProfile].workoutPlan[activeDay] || profiles[activeProfile].workoutPlan[0];
    if (activeExerciseIdx < currentPlan.exercises.length - 1) {
      setActiveExerciseIdx(prev => prev + 1);
    } else {
      markTodayCalendar();
    }
  };

  const toggleSet = (dayIdx, exIdx, setIdx, isTimeBased, timeInSeconds, totalSets) => {
    const key = `${activeProfile}-${dayIdx}-${exIdx}-${setIdx}`;
    if (!completedSets[key]) {
      if (isTimeBased) {
        setTimerMode('work');
        setTimeLeft(timeInSeconds);
        setActiveWorkSet({ key, exIdx, totalSets });
        setIsTimerRunning(true);
      } else {
        const newSets = { ...completedSets, [key]: true };
        setCompletedSets(newSets);
        checkAndTriggerExertion(newSets, exIdx, totalSets);
      }
    } else {
      setCompletedSets(prev => ({ ...prev, [key]: false }));
      if (activeWorkSet?.key === key) {
        setIsTimerRunning(false);
        setActiveWorkSet(null);
      }
    }
  };

  const markTodayCalendar = () => {
    const today = new Date().toISOString().split('T')[0];
    setCalendarData(prev => ({ ...prev, [`${today}-${activeProfile}`]: true }));
  };

  const toggleCalendarDay = (dayNum) => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const key = `${dateStr}-${activeProfile}`;
    setCalendarData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMealChange = (mealIndex, optionIndex) => {
    setMealSelections(prev => ({ ...prev, [`${activeProfile}-${mealIndex}`]: parseInt(optionIndex) }));
  };
  const getSelectedMealOption = (mealIndex) => mealSelections[`${activeProfile}-${mealIndex}`] || 0;

  const rawProfiles = {
    Andros: {
      goal: 'Recomposición, cuidado de hernia discal.',
      warning: 'Mantén la columna neutral. Cero abdominales tipo "crunch".',
      nutrition: {
        calories: '~2,000', protein: '160g',
        meals: [
          { time: '12:00 PM', title: 'Romper Ayuno', options: [{ name: 'Opción 1: Huevos y Avena', items: [{scale: '200g Huevos', noScale: '4 Huevos'}, {scale: '250g Avena', noScale: '1 Taza'}] }, { name: 'Opción 2: Atún y Arroz', items: [{scale: '200g Atún', noScale: '2 Latas'}, {scale: '150g Arroz', noScale: '1 Taza'}] }] },
          { time: '4:00 PM', title: 'Comida Principal', options: [{ name: 'Opción 1: Pollo y Papa', items: [{scale: '200g Pollo', noScale: '1 Pechuga'}, {scale: '300g Papas', noScale: '2 Papas'}] }, { name: 'Opción 2: Lentejas y Huevo', items: [{scale: '400g Lentejas', noScale: '2 Tazas'}, {scale: '150g Huevo', noScale: '3 Huevos'}] }] },
          { time: '7:30 PM', title: 'Cierre de Ventana', options: [{ name: 'Opción 1: Pollo y Maní', items: [{scale: '150g Pollo', noScale: '1 Pechuga'}, {scale: '30g Maní', noScale: '1 Puñado'}] }] }
        ]
      },
      workoutPlan: [
        { day: 'Día 1', title: 'Tren Superior (Empuje)', exercises: [
          { name: 'Flexiones de pecho', sets: '3', reps: '8-15', note: 'Apoya rodillas si es necesario.', youtubeId: "zUymek3A64A" },
          { name: 'Pike Push-ups', sets: '3', reps: '8-12', note: 'Foco en hombros.', youtubeId: "br9PF4gkXEA" },
          { name: 'Fondos para tríceps', sets: '3', reps: '10-15', note: 'Espalda cerca de la silla.', youtubeId: "jDafIn0WMUw" },
          { name: 'Plancha frontal', sets: '3', reps: '30 seg', note: 'Aprieta glúteos y abdomen.', youtubeId: "aFk1SjShgO4" }
        ]},
        { day: 'Día 2', title: 'Tren Inferior', exercises: [
          { name: 'Sentadillas', sets: '3', reps: '12-15', note: 'Torso erguido.', youtubeId: "ba8tr1NzwXU" },
          { name: 'Zancadas hacia atrás', sets: '3', reps: '10', note: 'Menos tensión en rodillas.', youtubeId: "ZRpD5MfIYA0" },
          { name: 'Puente de glúteo', sets: '4', reps: '15', note: 'Seguro para la hernia.', youtubeId: "LkCJxld5Bj4" },
          { name: 'Elevación de talones', sets: '4', reps: '20', note: 'Sobre puntas.', youtubeId: "ww-6lRXvI9Y" }
        ]},
        { day: 'Día 3', title: 'Estabilidad Core (McGill)', exercises: [
          { name: 'Bird-Dog', sets: '3', reps: '6', note: 'Pausa de 3 seg arriba.', youtubeId: "OdP8gNwsndM" },
          { name: 'Plancha lateral', sets: '3', reps: '20 seg', note: 'Apoya rodillas si necesitas.', youtubeId: "vyLwEzLWe_g" },
          { name: 'Curl-up McGill', sets: '3', reps: '8', note: 'Manos bajo zona lumbar.', youtubeId: "fJi6F0VDqLY" }
        ]},
        { day: 'Día 4', title: 'Tren Superior (Tracción)', exercises: [
          { name: 'Back Widows', sets: '4', reps: '10-15', note: 'Codos empujan el suelo.', youtubeId: "jDafIn0WMUw" },
          { name: 'Deslizamientos suelo', sets: '3', reps: '10', note: 'Tira con la espalda.', youtubeId: "ba8tr1NzwXU" },
          { name: 'Superman holds', sets: '3', reps: '15 seg', note: 'Eleva pecho suavemente.', youtubeId: "ww-6lRXvI9Y" }
        ]},
        { day: 'Día 5', title: 'Tren Inferior y Core', exercises: [
          { name: 'Sentadilla Búlgara', sets: '3', reps: '8-12', note: 'Pie trasero en silla.', youtubeId: "ZRpD5MfIYA0" },
          { name: 'Step-ups', sets: '3', reps: '10', note: 'Sube a silla firme.', youtubeId: "ww-6lRXvI9Y" },
          { name: 'Wall Sit', sets: '3', reps: '45 seg', note: 'Espalda en pared.', youtubeId: "ba8tr1NzwXU" }
        ]}
      ]
    },
    Charlotte: {
      goal: 'Tonificar glúteos/abdomen, pérdida de grasa.',
      warning: 'Cero flexión profunda de rodilla si hay dolor.',
      nutrition: {
        calories: '~1,450', protein: '110g',
        meals: [
          { time: '12:00 PM', title: 'Romper Ayuno', options: [{ name: 'Opción 1: Huevos y Tortilla', items: [{scale: '100g Huevos', noScale: '2 Huevos'}, {scale: '60g Tortillas', noScale: '2 Tortillas'}] }, { name: 'Opción 2: Avena Proteica', items: [{scale: '40g Avena seca', noScale: '1/2 Taza avena'}, {scale: '1 Lata Atún', noScale: '1 Lata atún'}] }] },
          { time: '4:00 PM', title: 'Comida Principal', options: [{ name: 'Opción 1: Pollo y Arroz', items: [{scale: '120g Pollo', noScale: '1 Pechuga chica'}, {scale: '80g Arroz', noScale: '1/2 Taza arroz'}] }, { name: 'Opción 2: Frijol y Huevo', items: [{scale: '300g Frijol', noScale: '1.5 Tazas frijol'}, {scale: '100g Huevo', noScale: '2 Huevos duros'}] }] },
          { time: '7:30 PM', title: 'Cierre de Ventana', options: [{ name: 'Opción 1: Atún y Ensalada', items: [{scale: '100g Atún', noScale: '1 Lata atún'}, {scale: 'Ensalada', noScale: 'Libre'}] }] }
        ]
      },
      workoutPlan: [
        { day: 'Día 1', title: 'Glúteos y Core', exercises: [
          { name: 'Puente de glúteo', sets: '4', reps: '15-20', note: 'Aprieta 2 seg arriba.', youtubeId: "LkCJxld5Bj4" },
          { name: 'Frog Pumps', sets: '3', reps: '20', note: 'Suelas juntas.', youtubeId: "rgljhH1X4vc" },
          { name: 'Elevación lateral', sets: '3', reps: '15', note: 'Acostada de lado.', youtubeId: "ww-6lRXvI9Y" },
          { name: 'Plancha (Plank)', sets: '3', reps: '30 seg', note: 'Abdomen apretado.', youtubeId: "m8lSq4SC_eM" }
        ]},
        { day: 'Día 2', title: 'Tren Superior', exercises: [
          { name: 'Flexiones rodillas', sets: '3', reps: '10-15', note: 'Cojín bajo rodillas.', youtubeId: "ba8tr1NzwXU" },
          { name: 'Back Widows', sets: '3', reps: '12', note: 'Empuja con codos.', youtubeId: "ba8tr1NzwXU" },
          { name: 'Fondos tríceps', sets: '3', reps: '12', note: 'Espalda cerca silla.', youtubeId: "jDafIn0WMUw" }
        ]},
        { day: 'Día 3', title: 'Glúteo Aislado', exercises: [
          { name: 'Puente una pierna', sets: '3', reps: '12', note: 'Empuja con talón.', youtubeId: "LkCJxld5Bj4" },
          { name: 'Clamshells', sets: '3', reps: '15', note: 'De lado.', youtubeId: "rgljhH1X4vc" },
          { name: 'Toques de talón', sets: '3', reps: '20', note: 'Boca arriba.', youtubeId: "m8lSq4SC_eM" }
        ]},
        { day: 'Día 4', title: 'Core y Brazos', exercises: [
          { name: 'Flutter Kicks', sets: '3', reps: '30 seg', note: 'Manos bajo glúteos.', youtubeId: "ybdeVE83b4E" },
          { name: 'Plancha lateral', sets: '3', reps: '20 seg', note: 'Oblicuos.', youtubeId: "vyLwEzLWe_g" },
          { name: 'Superman holds', sets: '3', reps: '15 seg', note: 'Zona lumbar suave.', youtubeId: "ww-6lRXvI9Y" }
        ]},
        { day: 'Día 5', title: 'Cadera', exercises: [
          { name: 'Peso Muerto Rumano', sets: '3', reps: '15', note: 'Rodillas casi estiradas.', youtubeId: "mYWE12heiDA" },
          { name: 'Puente Isométrico', sets: '3', reps: '45 seg', note: 'Mantén cadera arriba.', youtubeId: "LkCJxld5Bj4" },
          { name: 'Elevación piernas', sets: '3', reps: '15', note: 'Piernas rectas.', youtubeId: "HrxOWhPdsOY" }
        ]}
      ]
    }
  };

  const profiles = JSON.parse(JSON.stringify(rawProfiles));
  if (suppType.protein) {
    Object.keys(profiles).forEach(p => {
      profiles[p].nutrition.meals[1].options.push({
        name: 'Opción 3 (Rápida): Batido',
        items: [{scale: '30g Proteína (1 scoop)', noScale: '1 Scoop'}, {scale: '100g Plátano', noScale: '1 Plátano'}, {scale: '15g Maní', noScale: '1 Cda. maní'}]
      });
    });
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <HeartPulse className="w-16 h-16 text-red-500 mb-6 animate-pulse" />
        <h1 className="text-4xl font-black mb-2">FitPlan Duo</h1>
        <p className="text-slate-400 mb-12 tracking-widest uppercase text-sm font-bold">Selecciona tu perfil</p>
        
        <div className="w-full max-w-sm space-y-4">
          <button onClick={() => setActiveProfile('Andros')} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-3xl font-black text-xl flex justify-between items-center transition-all active:scale-95 shadow-lg shadow-blue-900/50">
            <span>ANDROS</span>
            <Users className="w-6 h-6 opacity-50" />
          </button>
          <button onClick={() => setActiveProfile('Charlotte')} className="w-full bg-pink-600 hover:bg-pink-700 text-white p-6 rounded-3xl font-black text-xl flex justify-between items-center transition-all active:scale-95 shadow-lg shadow-pink-900/50">
            <span>CHARLOTTE</span>
            <Users className="w-6 h-6 opacity-50" />
          </button>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[activeProfile];
  const currentPlan = currentProfile.workoutPlan[activeDay] || currentProfile.workoutPlan[0];

  const calculateTotalProgress = () => {
    let total = 0, done = 0;
    currentPlan.exercises.forEach((ex, exIdx) => {
      const s = parseInt(ex.sets);
      total += s;
      for(let i=0; i<s; i++) if(completedSets[`${activeProfile}-${activeDay}-${exIdx}-${i}`]) done++;
    });
    return total === 0 ? 0 : Math.round((done/total)*100);
  };

  const getDaysInMonth = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();

  const currentExercise = currentPlan.exercises[activeExerciseIdx];
  const isTimeBased = currentExercise.reps.toLowerCase().includes('seg') || currentExercise.reps.toLowerCase().includes('min');
  const timeValue = parseInt(currentExercise.reps.match(/\d+/)?.[0] || 0);
  const finalTime = currentExercise.reps.toLowerCase().includes('min') ? timeValue * 60 : timeValue;
  const numSets = parseInt(currentExercise.sets);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-44">
      
      {showExertionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border-4 border-slate-100 transform transition-all">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl mb-6 flex gap-3 items-start border border-blue-100">
              <Brain className="w-8 h-8 shrink-0 text-blue-500" />
              <p className="text-xs font-black leading-relaxed italic">{currentMotivation}</p>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 text-center uppercase tracking-tight mb-2">Evaluación de Fatiga</h3>
            <p className="text-center text-sm font-bold text-slate-500 mb-6">Ajustando temporizador para el siguiente ejercicio</p>
            
            <div className="space-y-3">
              <button onClick={() => handleExertionResponse(120)} className="w-full bg-red-50 hover:bg-red-100 text-red-700 p-4 rounded-2xl font-black border-2 border-red-200 transition-all active:scale-95 flex justify-between items-center">
                <span>ALTO (Muy cansado)</span>
                <span className="bg-red-200 px-3 py-1 rounded-full text-xs">120s Rest</span>
              </button>
              <button onClick={() => handleExertionResponse(90)} className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 p-4 rounded-2xl font-black border-2 border-amber-200 transition-all active:scale-95 flex justify-between items-center">
                <span>MEDIO (Puedo seguir)</span>
                <span className="bg-amber-200 px-3 py-1 rounded-full text-xs">90s Rest</span>
              </button>
              <button onClick={() => handleExertionResponse(60)} className="w-full bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-2xl font-black border-2 border-green-200 transition-all active:scale-95 flex justify-between items-center">
                <span>BAJO (Imparable)</span>
                <span className="bg-green-200 px-3 py-1 rounded-full text-xs">60s Rest</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 text-white p-5 shadow-md sticky top-0 z-20">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              <HeartPulse className="w-5 h-5 text-red-500" /> FitPlan Duo
            </h1>
            <p className="text-slate-400 text-[10px] mt-0.5 uppercase font-bold tracking-widest">{activeProfile}: {currentProfile.goal}</p>
          </div>
          <button onClick={() => setActiveProfile(null)} className="bg-slate-800 border border-slate-700 p-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-red-900/50 hover:border-red-800 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        
        {activeTab === 'entrenamiento' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className={`p-3 rounded-xl flex items-start gap-3 text-sm ${activeProfile==='Charlotte'?'bg-pink-50 border-pink-100 text-pink-800':'bg-amber-50 border-amber-100 text-amber-800'} border shadow-sm`}>
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p><strong>Aviso Técnico:</strong> {currentProfile.warning}</p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {currentProfile.workoutPlan.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)} className={`px-5 py-2 rounded-full text-sm font-bold transition-all shrink-0 ${activeDay===i?'bg-blue-600 text-white shadow-lg shadow-blue-200':'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                  {d.day}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-black text-xl text-slate-800 uppercase tracking-tighter">{currentPlan.title}</h2>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global</p>
                  <p className="text-xl font-black text-blue-600">{calculateTotalProgress()}%</p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Ejercicio {activeExerciseIdx + 1} de {currentPlan.exercises.length}
                  </span>
                  
                  <div className="flex gap-2">
                    <button onClick={() => setActiveExerciseIdx(Math.max(0, activeExerciseIdx - 1))} disabled={activeExerciseIdx === 0} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 disabled:opacity-30 active:bg-slate-200 transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveExerciseIdx(Math.min(currentPlan.exercises.length - 1, activeExerciseIdx + 1))} disabled={activeExerciseIdx === currentPlan.exercises.length - 1} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 disabled:opacity-30 active:bg-slate-200 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-slate-900 text-2xl leading-tight uppercase tracking-tight">{currentExercise.name}</h3>
                  <p className="text-blue-600 font-black text-lg">{currentExercise.sets} SERIES x {currentExercise.reps}</p>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">💡 {currentExercise.note}</p>
                  
                  <div className="pt-2">
                    <YouTubeButton videoId={currentExercise.youtubeId} />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Toca para completar</p>
                    <div className="flex flex-wrap gap-3">
                      {Array.from({length: numSets}).map((_, sIdx) => {
                        const key = `${activeProfile}-${activeDay}-${activeExerciseIdx}-${sIdx}`;
                        const isDone = completedSets[key];
                        const isWorking = activeWorkSet?.key === key;
                        
                        const baseClasses = "h-14 flex items-center justify-center rounded-2xl border-2 font-black transition-all shadow-sm active:scale-95";
                        const statusClasses = isWorking 
                          ? "w-28 bg-amber-500 border-amber-600 text-white animate-pulse" 
                          : isDone 
                            ? "w-14 bg-green-500 border-green-600 text-white" 
                            : isTimeBased 
                              ? "w-24 bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                              : "w-14 bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50";

                        return (
                          <button 
                            key={sIdx} 
                            onClick={() => toggleSet(activeDay, activeExerciseIdx, sIdx, isTimeBased, finalTime, numSets)} 
                            className={`${baseClasses} ${statusClasses}`}
                          >
                            {isWorking ? (
                              <span className="flex items-center gap-2"><Timer className="w-5 h-5"/> {timeLeft}s</span>
                            ) : isDone ? (
                              <CheckCircle2 className="w-7 h-7"/>
                            ) : isTimeBased ? (
                              <span className="flex items-center gap-1.5"><Play className="w-4 h-4 ml-0.5 fill-current"/> {finalTime}s</span>
                            ) : (
                              <span className="text-xl">{sIdx+1}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nutricion' && (
          <div className="space-y-4 animate-in fade-in duration-300 pb-20">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                  <Beaker className="w-5 h-5 text-indigo-500"/> Suplementación
                </h2>
                
                {suppStatus === 'none' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 font-bold uppercase tracking-tighter leading-tight">¿Consumes suplementos?</span>
                      <button onClick={() => setSuppStatus('taking')} className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Sí, Activar</button>
                    </div>
                    <button onClick={() => setSuppStatus('suggest')} className="w-full bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 tracking-widest">
                      <Info className="w-4 h-4" /> Ver Sugerencias
                    </button>
                  </div>
                )}

                {suppStatus === 'taking' && (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={suppType.protein} onChange={e => setSuppType({...suppType, protein: e.target.checked})} className="w-6 h-6 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"/>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">Proteína en Polvo (Whey)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={suppType.creatine} onChange={e => setSuppType({...suppType, creatine: e.target.checked})} className="w-6 h-6 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"/>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">Creatina (5g Diarios)</span>
                      </label>
                    </div>
                    <button onClick={() => setSuppStatus('none')} className="mt-4 text-[10px] text-indigo-600 font-black uppercase tracking-widest underline decoration-2">Guardar y Cerrar</button>
                  </div>
                )}

                {suppStatus === 'suggest' && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <ul className="text-xs text-amber-800 space-y-2 font-bold leading-relaxed mb-4">
                      <li>• <strong>Proteína:</strong> Si no llegas a tu meta diaria con comida.</li>
                      <li>• <strong>Creatina:</strong> Confiable para fuerza y recuperación.</li>
                    </ul>
                    <div className="flex gap-2">
                      <button onClick={() => setSuppStatus('taking')} className="flex-1 bg-amber-200 text-amber-900 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95">Configurar</button>
                      <button onClick={() => setSuppStatus('none')} className="flex-1 bg-white text-amber-700 border border-amber-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95">Ocultar</button>
                    </div>
                  </div>
                )}
             </div>

             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                    <Apple className="w-5 h-5 text-red-500"/> Plan Base
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Calorías</p>
                    <p className="text-xl font-bold text-slate-800">{currentProfile.nutrition.calories}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Proteína</p>
                    <p className="text-xl font-bold text-blue-600">{currentProfile.nutrition.protein}</p>
                  </div>
                </div>

                <div className="flex bg-slate-100 rounded-lg overflow-hidden h-8 mb-5 border border-slate-200">
                  <div className="w-2/3 bg-slate-800 text-[10px] text-white flex items-center justify-center font-bold uppercase tracking-widest">Ayuno (16h)</div>
                  <div className="w-1/3 bg-green-500 text-[10px] text-white flex items-center justify-center font-bold uppercase tracking-widest">Comida (8h)</div>
                </div>

                <div className="flex bg-slate-200 p-1 rounded-lg mb-6 border border-slate-200 shadow-inner">
                  <button onClick={() => setUseScale(true)} className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all uppercase tracking-widest ${useScale ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Con Báscula</button>
                  <button onClick={() => setUseScale(false)} className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all uppercase tracking-widest ${!useScale ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Medidas Caseras</button>
                </div>
                
                <div className="space-y-4">
                  {currentProfile.nutrition.meals.map((meal, mIdx) => {
                    const selIdx = getSelectedMealOption(mIdx);
                    const safeIdx = selIdx < meal.options.length ? selIdx : 0;
                    return (
                      <div key={mIdx} className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{meal.time}</span>
                          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-tight">{meal.title}</h4>
                        </div>
                        <div className="relative mb-4">
                          <select className="w-full bg-slate-50 border-2 border-slate-100 text-sm font-bold rounded-xl h-11 px-4 appearance-none focus:border-blue-400 outline-none" value={safeIdx} onChange={e => handleMealChange(mIdx, e.target.value)}>
                            {meal.options.map((o, oi) => <option key={oi} value={oi}>{o.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        <ul className="space-y-2">
                          {meal.options[safeIdx].items.map((it, iti) => (
                            <li key={iti} className="text-xs font-bold text-slate-700 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              <span>{useScale ? it.scale : it.noScale}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'progreso' && (
          <div className="space-y-4 animate-in fade-in duration-300 pb-20">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <h2 className="font-black text-xl text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-blue-600" /> Historial
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{currentMonthName}</p>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-500 font-bold mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  Toca un día para marcarlo manualmente. Los días se marcan automáticamente al terminar una rutina.
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                    <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase">{day}</div>
                  ))}
                  {Array.from({length: getDaysInMonth()}).map((_, i) => {
                    const d = new Date();
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(i+1).padStart(2, '0')}`;
                    const isDone = calendarData[`${dateStr}-${activeProfile}`];
                    const isToday = (i+1) === d.getDate();

                    return (
                      <button 
                        key={i}
                        onClick={() => toggleCalendarDay(i + 1)}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl font-black text-sm transition-all border-2 active:scale-90
                          ${isDone ? 'bg-green-500 border-green-600 text-white shadow-sm' : 
                            isToday ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                            'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`}
                      >
                        {i + 1}
                        {isDone && <CheckCircle2 className="w-3 h-3 mt-0.5 opacity-90" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'entrenamiento' && (
        <div className="fixed bottom-[96px] left-0 right-0 p-4 pointer-events-none z-30">
          <div className={`max-w-md mx-auto rounded-3xl shadow-2xl p-5 flex items-center justify-between pointer-events-auto border-2 transition-all ${timerMode==='work'?'bg-red-600 border-red-400 shadow-red-500/30':'bg-slate-900 border-slate-800'} text-white`}>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${timerMode==='work'?'bg-red-500':'bg-slate-800'}`}>
                <Timer className={`w-7 h-7 ${isTimerRunning?'animate-pulse':''}`}/>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">{timerMode==='work'?'🔥 Esfuerzo':'☕ Descanso'}</span>
                <span className="text-3xl font-mono font-black tabular-nums">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {timerMode === 'rest' && (
                <>
                  <button onClick={() => resetTimer(60)} className="h-12 px-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-xs border border-slate-700 transition-colors uppercase tracking-widest active:scale-95">60s</button>
                  <button onClick={() => resetTimer(90)} className="h-12 px-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-xs border border-slate-700 transition-colors uppercase tracking-widest active:scale-95">90s</button>
                </>
              )}
              <button onClick={toggleTimer} className={`w-14 h-12 flex items-center justify-center rounded-2xl transition-all ${isTimerRunning?'bg-amber-500 text-amber-950':'bg-white text-slate-950 shadow-lg active:scale-90'}`}>
                {isTimerRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" fill="currentColor"/>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto flex justify-between px-6 py-3">
          <button onClick={() => setActiveTab('entrenamiento')} className={`flex flex-col items-center p-2 rounded-2xl transition-all w-20 ${activeTab==='entrenamiento'?'text-blue-600 bg-blue-50 shadow-inner border border-blue-100':'text-slate-400 hover:text-slate-600'}`}>
            <Activity className="w-6 h-6 mb-1"/>
            <span className="text-[9px] font-black uppercase tracking-widest">Rutina</span>
          </button>
          <button onClick={() => setActiveTab('progreso')} className={`flex flex-col items-center p-2 rounded-2xl transition-all w-20 ${activeTab==='progreso'?'text-blue-600 bg-blue-50 shadow-inner border border-blue-100':'text-slate-400 hover:text-slate-600'}`}>
            <CalendarIcon className="w-6 h-6 mb-1"/>
            <span className="text-[9px] font-black uppercase tracking-widest">Avance</span>
          </button>
          <button onClick={() => setActiveTab('nutricion')} className={`flex flex-col items-center p-2 rounded-2xl transition-all w-20 ${activeTab==='nutricion'?'text-blue-600 bg-blue-50 shadow-inner border border-blue-100':'text-slate-400 hover:text-slate-600'}`}>
            <Apple className="w-6 h-6 mb-1"/>
            <span className="text-[9px] font-black uppercase tracking-widest">Dieta</span>
          </button>
        </div>
      </div>
    </div>
  );
}