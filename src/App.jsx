import React, { useState, useEffect } from 'react';
import { Activity, Apple, CheckCircle2, Circle, AlertTriangle, Timer, Play, Pause, Users, HeartPulse, ChevronDown, Image as ImageIcon, ExternalLink, Info, Beaker } from 'lucide-react';

const ExerciseMedia = ({ src, alt, exerciseName }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div className="w-full h-32 bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-slate-200 text-slate-500">
        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs text-center px-4 mb-2">GIF no disponible</span>
        <a 
          href={`https://www.youtube.com/results?search_query=como+hacer+${encodeURIComponent(exerciseName)}+ejercicio`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-blue-200 transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> Ver en YouTube
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
          <span className="text-xs text-slate-400 font-medium">Cargando GIF...</span>
        </div>
      )}
      <img 
        src={src} 
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('entrenamiento');
  const [activeDay, setActiveDay] = useState(0);
  const [activeProfile, setActiveProfile] = useState('Andros');
  const [useScale, setUseScale] = useState(true);
  
  // Tracking states
  const [completedSets, setCompletedSets] = useState({}); // formato: Profile-DayIdx-ExIdx-SetIdx
  const [mealSelections, setMealSelections] = useState({});
  
  // Supplements state
  const [suppStatus, setSuppStatus] = useState('none'); // 'none', 'taking', 'suggest'
  const [suppType, setSuppType] = useState({ protein: false, creatine: false });

  // Advanced Timer State
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('rest'); // 'rest' o 'work'
  const [activeWorkSet, setActiveWorkSet] = useState(null);
  const [activeWorkName, setActiveWorkName] = useState('');

  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio no soportado");
    }
  };

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      setIsTimerRunning(false);
      playBeep();
      
      if (timerMode === 'work') {
        // Marca la serie de esfuerzo como completada
        if (activeWorkSet) {
          setCompletedSets(prev => ({ ...prev, [activeWorkSet]: true }));
        }
        // Pasa automáticamente a descanso
        setTimerMode('rest');
        setTimeLeft(60);
        setIsTimerRunning(true);
        setActiveWorkSet(null);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMode, activeWorkSet]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  
  const resetTimer = (seconds = 60, mode = 'rest') => {
    setTimerMode(mode);
    setIsTimerRunning(mode === 'rest'); // Inicia auto si es descanso
    setTimeLeft(seconds);
    if (mode === 'rest') setActiveWorkSet(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSet = (dayIdx, exIdx, setIdx, isTimeBased, timeInSeconds, exName) => {
    const key = `${activeProfile}-${dayIdx}-${exIdx}-${setIdx}`;
    const isCurrentlyDone = completedSets[key];

    if (!isCurrentlyDone) {
      if (isTimeBased) {
        // Activa modo Esfuerzo/Tiempo
        setTimerMode('work');
        setTimeLeft(timeInSeconds);
        setActiveWorkSet(key);
        setActiveWorkName(exName);
        setIsTimerRunning(true);
      } else {
        // Marca normal y activa descanso
        setCompletedSets(prev => ({ ...prev, [key]: true }));
        resetTimer(60, 'rest');
      }
    } else {
      // Desmarcar
      setCompletedSets(prev => ({ ...prev, [key]: false }));
      if (activeWorkSet === key) {
        setIsTimerRunning(false);
        setActiveWorkSet(null);
      }
    }
  };

  const handleMealChange = (mealIndex, optionIndex) => {
    setMealSelections(prev => ({
      ...prev,
      [`${activeProfile}-${mealIndex}`]: parseInt(optionIndex)
    }));
  };

  const getSelectedMealOption = (mealIndex) => {
    return mealSelections[`${activeProfile}-${mealIndex}`] || 0;
  };

  const defaultGif = "https://media1.giphy.com/media/l3vR5NfXwQ0hU02qY/giphy.gif";

  const rawProfiles = {
    Andros: {
      name: 'Andros',
      goal: 'Recomposición, cuidado de hernia discal.',
      nutrition: {
        calories: '~2,000',
        protein: '160g',
        type: 'Ayuno Intermitente 16:8 (Económica)',
        meals: [
          { 
            time: '12:00 PM', title: 'Romper Ayuno',
            options: [
              { name: 'Opción 1: Huevos y Avena', items: [{scale: '200g Huevos', noScale: '4 Huevos enteros'}, {scale: '250g Avena', noScale: '1 Taza de avena'}, {scale: '100g Plátano', noScale: '1 Plátano'}] },
              { name: 'Opción 2: Atún y Arroz', items: [{scale: '200g Atún', noScale: '2 Latas de atún'}, {scale: '150g Arroz', noScale: '1 Taza de arroz'}, {scale: '150g Manzana', noScale: '1 Manzana'}] }
            ]
          },
          { 
            time: '4:00 PM', title: 'Comida Principal',
            options: [
              { name: 'Opción 1: Pollo y Papa', items: [{scale: '200g Pollo', noScale: '1 Pechuga'}, {scale: '300g Papas', noScale: '2 Papas medianas'}, {scale: '100g Brócoli', noScale: '1 Taza brócoli'}] },
              { name: 'Opción 2: Lentejas y Huevo', items: [{scale: '400g Lentejas', noScale: '2 Tazas lentejas'}, {scale: '150g Huevo', noScale: '3 Huevos duros'}, {scale: 'Ensalada', noScale: 'Ensalada libre'}] }
            ]
          },
          { 
            time: '7:30 PM', title: 'Cierre de Ventana',
            options: [
              { name: 'Opción 1: Pollo y Cacahuates', items: [{scale: '150g Pollo', noScale: '1 Pechuga mediana'}, {scale: 'Aceite oliva (15ml)', noScale: '1 Cda. aceite oliva'}, {scale: '30g Cacahuates', noScale: '1 Puñado cacahuates'}] },
              { name: 'Opción 2: Huevos y Frijol', items: [{scale: '120g Claras + 50g Huevo', noScale: '4 Claras + 1 Huevo'}, {scale: '200g Frijoles', noScale: '1 Taza frijoles'}, {scale: 'Vegetales libres', noScale: 'Vegetales libres'}] }
            ]
          }
        ]
      },
      warning: 'Mantén la columna neutral. Cero abdominales tipo "crunch".',
      workoutPlan: [
        {
          day: 'Día 1', title: 'Tren Superior (Empuje)',
          exercises: [
            { name: 'Flexiones de pecho', sets: '3', reps: '8-15', note: 'Apoya rodillas si es necesario.', gif: defaultGif },
            { name: 'Pike Push-ups', sets: '3', reps: '8-12', note: 'Cadera alta, enfocado en hombros.', gif: defaultGif },
            { name: 'Fondos para tríceps', sets: '3', reps: '10-15', note: 'Espalda cerca de la silla.', gif: defaultGif },
            { name: 'Plancha frontal', sets: '3', reps: '30 seg', note: 'Aprieta glúteos y abdomen.', gif: defaultGif },
          ]
        },
        {
          day: 'Día 2', title: 'Tren Inferior',
          exercises: [
            { name: 'Sentadillas', sets: '3', reps: '12-15', note: 'Torso erguido, baja sin dolor lumbar.', gif: defaultGif },
            { name: 'Zancadas hacia atrás', sets: '3', reps: '10', note: 'Menos tensión en rodillas.', gif: defaultGif },
            { name: 'Puente de glúteo', sets: '4', reps: '15', note: 'No daña la hernia.', gif: defaultGif },
            { name: 'Elevación de talones', sets: '4', reps: '20', note: 'De pie, elevando sobre puntas.', gif: defaultGif },
          ]
        },
        {
          day: 'Día 3', title: 'Core (McGill) y Recuperación',
          exercises: [
            { name: 'Bird-Dog', sets: '3', reps: '6', note: 'Pausa de 3 seg arriba.', gif: defaultGif },
            { name: 'Plancha lateral', sets: '3', reps: '20 seg', note: 'Apoya rodillas si necesitas.', gif: defaultGif },
            { name: 'Curl-up McGill', sets: '3', reps: '8', note: 'Manos bajo la zona lumbar.', gif: defaultGif },
            { name: 'Caminata ligera', sets: '1', reps: '30 min', note: 'Paso ligero sin impacto.', gif: defaultGif },
          ]
        },
        {
          day: 'Día 4', title: 'Tren Superior (Tracción)',
          exercises: [
            { name: 'Back Widows', sets: '4', reps: '10-15', note: 'Empuja con los codos el suelo.', gif: defaultGif },
            { name: 'Deslizamientos suelo', sets: '3', reps: '10', note: 'Tira con la espalda usando toalla.', gif: defaultGif },
            { name: 'Superman holds', sets: '3', reps: '15 seg', note: 'Eleva pecho suavemente. Omite si duele.', gif: defaultGif },
            { name: 'Plancha toques hombro', sets: '3', reps: '20', note: 'Cadera estable.', gif: defaultGif },
          ]
        },
        {
          day: 'Día 5', title: 'Tren Inferior y Core',
          exercises: [
            { name: 'Sentadilla Búlgara', sets: '3', reps: '8-12', note: 'Pie trasero en silla.', gif: defaultGif },
            { name: 'Step-ups', sets: '3', reps: '10', note: 'Sube a una silla firme.', gif: defaultGif },
            { name: 'Wall Sit', sets: '3', reps: '45 seg', note: 'Espalda apoyada en pared.', gif: defaultGif },
            { name: 'Bird-Dog', sets: '3', reps: '8', note: 'Refuerzo de estabilidad.', gif: defaultGif },
          ]
        }
      ]
    },
    Charlotte: {
      name: 'Charlotte',
      goal: 'Tonificar glúteos/abdomen, pérdida de grasa.',
      nutrition: {
        calories: '~1,450',
        protein: '110g',
        type: 'Ayuno Intermitente 16:8 (Económica)',
        meals: [
          { 
            time: '12:00 PM', title: 'Romper Ayuno',
            options: [
              { name: 'Opción 1: Huevos y Tortilla', items: [{scale: '100g Huevo + 60g Claras', noScale: '2 Huevos + 2 Claras'}, {scale: '60g Tortillas', noScale: '2 Tortillas maíz'}, {scale: '100g Manzana', noScale: '1 Manzana chica'}] },
              { name: 'Opción 2: Avena Proteica', items: [{scale: '40g Avena seca', noScale: '1/2 Taza avena'}, {scale: '100g Atún', noScale: '1 Lata atún'}, {scale: '15g Cacahuates', noScale: '1 Cda. cacahuates'}] }
            ]
          },
          { 
            time: '4:00 PM', title: 'Comida Principal',
            options: [
              { name: 'Opción 1: Pollo y Arroz', items: [{scale: '120g Pollo', noScale: '1 Pechuga chica'}, {scale: '80g Arroz', noScale: '1/2 Taza arroz'}, {scale: 'Vegetales al vapor', noScale: 'Abundante brócoli/repollo'}] },
              { name: 'Opción 2: Frijol y Huevo', items: [{scale: '300g Frijol', noScale: '1.5 Tazas frijol'}, {scale: '100g Huevo', noScale: '2 Huevos duros'}, {scale: 'Zanahorias', noScale: 'Zanahoria/pepino libre'}] }
            ]
          },
          { 
            time: '7:30 PM', title: 'Cierre de Ventana',
            options: [
              { name: 'Opción 1: Atún y Ensalada', items: [{scale: '100g Atún', noScale: '1 Lata atún'}, {scale: 'Aceite oliva (7ml)', noScale: '1/2 Cda. aceite oliva'}, {scale: 'Sin carbohidratos', noScale: 'Sin carbohidratos'}] },
              { name: 'Opción 2: Pollo Ligero', items: [{scale: '100g Pechuga', noScale: '1/2 Pechuga desmenuzada'}, {scale: 'Ensalada verde', noScale: 'Ensalada verde libre'}, {scale: '25g Tostadas', noScale: '2 Tostadas horneadas'}] }
            ]
          }
        ]
      },
      warning: 'Cero flexión profunda de rodilla. Si hay dolor articular, detente.',
      workoutPlan: [
        {
          day: 'Día 1', title: 'Glúteos y Core (Piso)',
          exercises: [
            { name: 'Puente de glúteo', sets: '4', reps: '15-20', note: 'Aprieta glúteos 2 seg arriba.', gif: defaultGif },
            { name: 'Frog Pumps', sets: '3', reps: '20', note: 'Suelas juntas, eleva cadera.', gif: defaultGif },
            { name: 'Elevación lateral', sets: '3', reps: '15', note: 'Acostada de lado.', gif: defaultGif },
            { name: 'Plancha (Plank)', sets: '3', reps: '30 seg', note: 'Mantén el abdomen apretado.', gif: defaultGif },
          ]
        },
        {
          day: 'Día 2', title: 'Tren Superior y Abdomen',
          exercises: [
            { name: 'Flexiones en rodillas', sets: '3', reps: '10-15', note: 'Cojín bajo las rodillas.', gif: defaultGif },
            { name: 'Back Widows', sets: '3', reps: '12', note: 'Boca arriba, empuja con codos.', gif: defaultGif },
            { name: 'Fondos tríceps', sets: '3', reps: '12', note: 'Mantén la espalda cerca de la silla.', gif: defaultGif },
            { name: 'Dead Bugs', sets: '3', reps: '10', note: 'Lumbar pegada al piso.', gif: defaultGif },
          ]
        },
        {
          day: 'Día 3', title: 'Glúteo Aislado',
          exercises: [
            { name: 'Puente una pierna', sets: '3', reps: '12', note: 'Empuja con el talón.', gif: defaultGif },
            { name: 'Clamshells (Ostras)', sets: '3', reps: '15', note: 'Acostada de lado.', gif: defaultGif },
            { name: 'Patada pierna recta', sets: '3', reps: '15', note: 'En 4 puntos, pierna estirada.', gif: defaultGif },
            { name: 'Toques de talón', sets: '3', reps: '20', note: 'Boca arriba, toca talones.', gif: defaultGif },
          ]
        },
        {
          day: 'Día 4', title: 'Core Intenso y Brazos',
          exercises: [
            { name: 'Flutter Kicks', sets: '3', reps: '30 seg', note: 'Manos bajo glúteos.', gif: defaultGif },
            { name: 'Plancha lateral', sets: '3', reps: '20 seg', note: 'Trabajo de oblicuos.', gif: defaultGif },
            { name: 'Toques hombro', sets: '3', reps: '20', note: 'Mantén la cadera quieta.', gif: defaultGif },
            { name: 'Superman holds', sets: '3', reps: '15 seg', note: 'Trabajo suave de zona lumbar.', gif: defaultGif },
          ]
        },
        {
          day: 'Día 5', title: 'Cadera y Tren Superior',
          exercises: [
            { name: 'Peso Muerto Rumano', sets: '3', reps: '15', note: 'Rodillas casi estiradas.', gif: defaultGif },
            { name: 'Puente Isométrico', sets: '3', reps: '45 seg', note: 'Mantén la cadera arriba.', gif: defaultGif },
            { name: 'Flexiones declinadas', sets: '3', reps: '10-12', note: 'Manos apoyadas en sofá.', gif: defaultGif },
            { name: 'Elevación piernas', sets: '3', reps: '15', note: 'Sentada, eleva piernas rectas.', gif: defaultGif },
          ]
        }
      ]
    }
  };

  // Inject supplements dynamically
  const profiles = JSON.parse(JSON.stringify(rawProfiles));
  if (suppType.protein) {
    profiles.Andros.nutrition.meals[1].options.push({
      name: 'Opción 3 (Rápida): Batido Proteico',
      items: [{scale: '30g Proteína en polvo (1 scoop)', noScale: '1 Scoop de Proteína'}, {scale: '100g Avena o Plátano', noScale: '1/2 Taza avena o 1 plátano'}, {scale: '15g Crema cacahuate', noScale: '1 Cda. crema de cacahuate'}]
    });
    profiles.Charlotte.nutrition.meals[1].options.push({
      name: 'Opción 3 (Rápida): Batido Proteico',
      items: [{scale: '30g Proteína en polvo (1 scoop)', noScale: '1 Scoop de Proteína'}, {scale: '100g Fruta (Fresa/Plátano)', noScale: '1 Taza fresas o 1 plátano'}, {scale: '10g Almendras', noScale: 'Puñito de almendras'}]
    });
  }

  const currentProfile = profiles[activeProfile];
  const currentPlan = currentProfile.workoutPlan;

  const calculateProgress = (dayIndex) => {
    let totalSets = 0;
    let doneSets = 0;
    currentPlan[dayIndex].exercises.forEach((ex, exIdx) => {
      const sets = parseInt(ex.sets);
      totalSets += sets;
      for (let i = 0; i < sets; i++) {
        if (completedSets[`${activeProfile}-${dayIndex}-${exIdx}-${i}`]) doneSets++;
      }
    });
    return totalSets === 0 ? 0 : Math.round((doneSets / totalSets) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      <div className="bg-slate-900 text-white p-5 shadow-md sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-500" /> FitPlan Duo
            </h1>
            <p className="text-slate-300 text-sm mt-1">{currentProfile.goal}</p>
          </div>
          <button 
            onClick={() => {
              setActiveProfile(prev => prev === 'Andros' ? 'Charlotte' : 'Andros');
              setActiveDay(0);
            }}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <Users className="w-4 h-4 text-blue-400" />
            {activeProfile}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {activeTab === 'entrenamiento' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className={`border rounded-lg p-3 flex items-start gap-3 ${activeProfile === 'Charlotte' ? 'bg-pink-50 border-pink-200 text-pink-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Precaución ({activeProfile}):</strong> {currentProfile.warning}
              </div>
            </div>

            <div className="flex overflow-x-auto pb-2 gap-2 snap-x hide-scrollbar">
              {currentPlan.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDay(idx)}
                  className={`snap-start whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors ${
                    activeDay === idx 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day.day}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg text-slate-800">{currentPlan[activeDay].title}</h2>
                  <p className="text-sm text-slate-500">Progreso: {calculateProgress(activeDay)}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {calculateProgress(activeDay)}%
                </div>
              </div>

              <div className="p-3 space-y-4">
                {currentPlan[activeDay].exercises.map((exercise, exIdx) => {
                  const numSets = parseInt(exercise.sets);
                  const isTimeBased = exercise.reps.includes('seg') || exercise.reps.includes('min');
                  const timeInSecs = isTimeBased ? parseInt(exercise.reps.match(/\d+/)[0]) : 0;
                  // Si tiene "min" asume que el num es minutos
                  const finalTimeInSecs = exercise.reps.includes('min') ? timeInSecs * 60 : timeInSecs;

                  return (
                    <div key={exIdx} className="p-4 rounded-xl border-2 border-slate-100 bg-white">
                      <div className="flex gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-slate-800 leading-tight mb-1">{exercise.name}</h3>
                          <p className="text-sm font-medium text-blue-600">Obj: {exercise.reps}</p>
                          <p className="text-sm text-slate-600 mt-1 leading-snug">{exercise.note}</p>
                        </div>
                      </div>

                      <ExerciseMedia src={exercise.gif} alt={exercise.name} exerciseName={exercise.name} />
                      
                      {/* Burbujas de Series */}
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Marcar Series ({numSets})</p>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: numSets }).map((_, setIdx) => {
                            const setKey = `${activeProfile}-${activeDay}-${exIdx}-${setIdx}`;
                            const isDone = completedSets[setKey];
                            const isActiveWork = activeWorkSet === setKey;

                            return (
                              <button
                                key={setIdx}
                                onClick={() => toggleSet(activeDay, exIdx, setIdx, isTimeBased, finalTimeInSecs, exercise.name)}
                                className={`h-12 flex items-center justify-center font-bold text-sm transition-all border-2 rounded-xl
                                  ${isTimeBased ? 'px-4' : 'w-12'}
                                  ${isActiveWork ? 'bg-amber-500 border-amber-600 text-white animate-pulse shadow-md' :
                                    isDone ? 'bg-green-500 border-green-600 text-white' :
                                    'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-400'}`}
                              >
                                {isActiveWork ? (
                                  <span className="flex items-center gap-1"><Timer className="w-4 h-4" /> {timeLeft}s</span>
                                ) : isDone ? (
                                  <CheckCircle2 className="w-6 h-6" />
                                ) : isTimeBased ? (
                                  <span className="flex items-center gap-1"><Play className="w-4 h-4 ml-0.5" fill="currentColor"/> {finalTimeInSecs}s</span>
                                ) : (
                                  setIdx + 1
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nutricion' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Módulo de Suplementación */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-800">
                <Beaker className="w-5 h-5 text-indigo-500" /> Suplementación
              </h2>

              {suppStatus === 'none' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">¿Tomas suplementos?</span>
                    <button onClick={() => setSuppStatus('taking')} className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-indigo-200 transition-colors">Sí, activarlos</button>
                  </div>
                  <button onClick={() => setSuppStatus('suggest')} className="w-full bg-white border-2 border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <Info className="w-4 h-4" /> Ver sugerencias
                  </button>
                </div>
              )}

              {suppStatus === 'taking' && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <p className="text-sm font-medium text-indigo-900 mb-3">Selecciona lo que consumes (Afectará tu menú):</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={suppType.protein} onChange={(e) => setSuppType({...suppType, protein: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                      <span className="text-sm text-slate-700">Proteína en polvo (Añade opción de batido)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={suppType.creatine} onChange={(e) => setSuppType({...suppType, creatine: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                      <span className="text-sm text-slate-700">Creatina (5g diarios)</span>
                    </label>
                  </div>
                  <button onClick={() => setSuppStatus('none')} className="mt-4 text-xs text-indigo-600 underline">Ocultar</button>
                </div>
              )}

              {suppStatus === 'suggest' && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <h3 className="font-bold text-amber-900 mb-2">Recomendaciones:</h3>
                  <ul className="text-sm text-amber-800 space-y-2 mb-4">
                    <li><strong>1. Proteína Whey:</strong> Solo si te cuesta llegar a tu meta de proteína con comida sólida.</li>
                    <li><strong>2. Creatina Monohidratada:</strong> 5g al día. Excelente para ganar fuerza, proteger músculo y rendir mejor. Muy segura.</li>
                  </ul>
                  <div className="flex gap-2">
                    <button onClick={() => setSuppStatus('taking')} className="flex-1 bg-amber-200 text-amber-900 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-300">Ya los tengo</button>
                    <button onClick={() => setSuppStatus('none')} className="flex-1 bg-white text-amber-700 border border-amber-200 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100">Cerrar</button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Apple className="w-5 h-5 text-red-500" /> Plan Base: {activeProfile}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold">Calorías</p>
                  <p className="text-xl font-bold text-slate-800">{currentProfile.nutrition.calories}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold">Proteína</p>
                  <p className="text-xl font-bold text-blue-600">{currentProfile.nutrition.protein}</p>
                </div>
              </div>

              <div className="flex bg-slate-100 rounded-lg overflow-hidden h-8 mb-5">
                <div className="w-2/3 bg-slate-800 text-xs text-white flex items-center justify-center font-medium">Ayuno (16h)</div>
                <div className="w-1/3 bg-green-500 text-xs text-white flex items-center justify-center font-medium">Comida (8h)</div>
              </div>

              <div className="flex bg-slate-200 p-1 rounded-lg mb-4">
                <button 
                  onClick={() => setUseScale(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${useScale ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Con Báscula
                </button>
                <button 
                  onClick={() => setUseScale(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!useScale ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Medidas Caseras
                </button>
              </div>

              <div className="space-y-4">
                {currentProfile.nutrition.meals.map((meal, idx) => {
                  const selectedOptIdx = getSelectedMealOption(idx);
                  // Safeguard if option was removed
                  const actualIdx = selectedOptIdx < meal.options.length ? selectedOptIdx : 0;
                  const selectedOption = meal.options[actualIdx];
                  
                  return (
                    <div key={idx} className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                          {meal.time}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800">{meal.title}</h4>
                      </div>

                      <div className="relative mb-3">
                        <select 
                          className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none font-medium"
                          value={actualIdx}
                          onChange={(e) => handleMealChange(idx, e.target.value)}
                        >
                          {meal.options.map((opt, optIdx) => (
                            <option key={optIdx} value={optIdx}>{opt.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>

                      <ul className="space-y-2 mt-2">
                        {selectedOption.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{useScale ? item.scale : item.noScale}</span>
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
      </div>

      {activeTab === 'entrenamiento' && (
        <div className="fixed bottom-[72px] left-0 right-0 p-3 pointer-events-none z-30">
          <div className={`max-w-sm mx-auto text-white rounded-2xl shadow-xl p-3 flex items-center justify-between pointer-events-auto border transition-colors duration-300 ${timerMode === 'work' ? 'bg-red-600 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex flex-col ml-2">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-0.5">
                {timerMode === 'work' ? `🔥 EN ACCIÓN` : '☕ DESCANSO'}
              </span>
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${isTimerRunning ? 'animate-pulse' : 'opacity-70'}`} />
                <span className={`text-2xl font-mono font-bold leading-none ${timeLeft <= 3 ? 'text-amber-300' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              {timerMode === 'rest' && (
                <>
                  <button onClick={() => resetTimer(60)} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors">60s</button>
                  <button onClick={() => resetTimer(90)} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors">90s</button>
                </>
              )}
              <button onClick={toggleTimer} className={`p-2 rounded-lg transition-colors ${isTimerRunning ? 'bg-amber-500 text-amber-950' : 'bg-white text-slate-800'}`}>
                {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-2xl mx-auto flex justify-around p-2 pb-safe">
          <button 
            onClick={() => setActiveTab('entrenamiento')}
            className={`flex flex-col items-center p-2 w-24 rounded-xl transition-colors ${activeTab === 'entrenamiento' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Activity className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Rutina</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('nutricion')}
            className={`flex flex-col items-center p-2 w-24 rounded-xl transition-colors ${activeTab === 'nutricion' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Apple className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Dieta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
