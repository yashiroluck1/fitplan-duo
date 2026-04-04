import React, { useState, useEffect, useRef } from 'react';
import { Activity, Apple, CheckCircle2, AlertTriangle, Timer, Play, Pause, Users, HeartPulse, ChevronDown, Info, Beaker, LogOut, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Brain, Trophy, Star, Target, Search, ExternalLink, Cloud, ShieldAlert, Lock } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- FIREBASE INIT ---
let app, auth, db, appId;
try {
  const firebaseConfig = {
    apiKey: "AIzaSyDt86xpJ2N2w-nuL4-COQz2p3MxhD0Ti_4",
    authDomain: "fitplan-duo.firebaseapp.com",
    projectId: "fitplan-duo",
    storageBucket: "fitplan-duo.firebasestorage.app",
    messagingSenderId: "878538632619",
    appId: "1:878538632619:web:c355278cfb419f9f6d36ee"
  };
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = firebaseConfig.projectId;
} catch (e) {
  console.error("No se pudo inicializar Firebase:", e);
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    }
    return initialValue;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}

const motivaciones = [
  "Tu cerebro está creando nuevas vías neuronales. ¡La resistencia física construye resiliencia mental!",
  "La dopamina liberada al terminar esta serie fortalecerá tu disciplina para mañana.",
  "Estás reduciendo la actividad de tu amígdala (centro del estrés). Este esfuerzo te da paz mental.",
  "El ardor muscular es tu cerebro adaptándose para hacerte más fuerte e imparable.",
  "Has vencido la resistencia inicial de tu cerebro. ¡Estás en estado de flujo, sigue así!"
];

export default function App() {
  const [activeProfile, setActiveProfile] = useLocalStorage('fp-profile', null);
  const [activeTab, setActiveTab] = useState('entrenamiento');
  const [activeDay, setActiveDay] = useState(0);
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  
  // Perfil seleccionado para ver en la pestaña de Nutrición (Andros puede cambiarlo)
  const [viewedDietProfile, setViewedDietProfile] = useState(null);

  // Estados Globales Sincronizados (se guardan en la nube)
  const [completedSets, setCompletedSets] = useState({}); 
  const [calendarData, setCalendarData] = useState({});
  const [mealSelections, setMealSelections] = useState({});
  const [suppData, setSuppData] = useState({}); 

  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [dbError, setDbError] = useState(false);

  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('rest'); 
  const [activeWorkSet, setActiveWorkSet] = useState(null);
  
  const [showExertionModal, setShowExertionModal] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [currentMotivation, setCurrentMotivation] = useState("");

  const [viewDate, setViewDate] = useState(new Date());
  
  const initializedProfileRef = useRef(null);

  // --- LÓGICA DE SINCRONIZACIÓN GLOBAL ---
  useEffect(() => {
    if (!auth) {
      setIsSyncing(false);
      return;
    }

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Error de autenticación:", e);
        setIsSyncing(false);
      }
    };
    
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const docRef = doc(db, 'appData', 'shared_state');
    
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.calendarData) setCalendarData(data.calendarData);
        if (data.completedSets) setCompletedSets(data.completedSets);
        if (data.mealSelections) setMealSelections(data.mealSelections);
        if (data.suppData) setSuppData(data.suppData);
      }
      setIsSyncing(false);
      setDbError(false);
    }, (err) => {
      console.error("Error escuchando la base de datos:", err);
      setIsSyncing(false);
      setDbError(true);
    });

    return () => unsub();
  }, [user]);

  const updateGlobalState = async (updates) => {
    if (!user || !db) return;
    try {
      const docRef = doc(db, 'appData', 'shared_state');
      await setDoc(docRef, updates, { merge: true });
    } catch (err) {
      console.error("Error al guardar en la nube:", err);
    }
  };
  // ----------------------------------------

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

  const rawProfiles = {
    Andros: {
      goal: 'Recomposición, cuidado de hernia discal.',
      warning: 'Mantén la columna neutral. Cero abdominales tipo "crunch".',
      nutrition: {
        calories: '~2,000', protein: '160g',
        meals: [
          { time: '12:00 PM', title: 'Romper Ayuno', options: [{ name: 'Opción 1: Huevos y Avena', items: [{scale: '200g Huevos', noScale: '4 Huevos enteros'}, {scale: '250g Avena', noScale: '1 Taza de avena'}, {scale: '100g Plátano', noScale: '1 Plátano'}] }, { name: 'Opción 2: Atún y Arroz', items: [{scale: '200g Atún', noScale: '2 Latas de atún'}, {scale: '150g Arroz', noScale: '1 Taza de arroz'}, {scale: '150g Manzana', noScale: '1 Manzana'}] }] },
          { time: '4:00 PM', title: 'Comida Principal', options: [{ name: 'Opción 1: Pollo y Papa', items: [{scale: '200g Pollo', noScale: '1 Pechuga'}, {scale: '300g Papas', noScale: '2 Papas medianas'}, {scale: '100g Brócoli', noScale: '1 Taza brócoli'}] }, { name: 'Opción 2: Lentejas y Huevo', items: [{scale: '400g Lentejas', noScale: '2 Tazas lentejas'}, {scale: '150g Huevo', noScale: '3 Huevos duros'}, {scale: 'Ensalada', noScale: 'Ensalada libre'}] }] },
          { time: '7:30 PM', title: 'Cierre de Ventana', options: [{ name: 'Opción 1: Pollo y Cacahuates', items: [{scale: '150g Pollo', noScale: '1 Pechuga mediana'}, {scale: 'Aceite oliva (15ml)', noScale: '1 Cda. aceite oliva'}, {scale: '30g Cacahuates', noScale: '1 Puñado cacahuates'}] }, { name: 'Opción 2: Huevos y Frijol', items: [{scale: '120g Claras + 50g Huevo', noScale: '4 Claras + 1 Huevo'}, {scale: '200g Frijoles', noScale: '1 Taza frijoles'}, {scale: 'Vegetales libres', noScale: 'Vegetales libres'}] }] }
        ]
      },
      workoutPlan: [
        { day: 'Día 1', title: 'Tren Superior (Empuje)', exercises: [
          { name: 'Flexiones de pecho', sets: '3', reps: '8-15', note: 'Apoya rodillas si es necesario.' },
          { name: 'Pike Push-ups', sets: '3', reps: '8-12', note: 'Foco en hombros.' },
          { name: 'Fondos para tríceps', sets: '3', reps: '10-15', note: 'Espalda cerca de la silla.' },
          { name: 'Plancha frontal', sets: '3', reps: '30 seg', note: 'Aprieta glúteos y abdomen.' }
        ]},
        { day: 'Día 2', title: 'Tren Inferior', exercises: [
          { name: 'Sentadillas', sets: '3', reps: '12-15', note: 'Torso erguido.' },
          { name: 'Zancadas hacia atrás', sets: '3', reps: '10 x pierna', note: 'Menos tensión en rodillas.' },
          { name: 'Puente de glúteo', sets: '4', reps: '15', note: 'Seguro para la hernia.' },
          { name: 'Elevación de talones', sets: '4', reps: '20', note: 'Sobre puntas.' }
        ]},
        { day: 'Día 3', title: 'Estabilidad Core (McGill)', exercises: [
          { name: 'Bird-Dog', sets: '3', reps: '6 x lado', note: 'Pausa de 3 seg arriba.' },
          { name: 'Plancha lateral', sets: '3', reps: '20 seg x lado', note: 'Apoya rodillas si necesitas.' },
          { name: 'Curl-up McGill', sets: '3', reps: '8', note: 'Manos bajo zona lumbar.' }
        ]},
        { day: 'Día 4', title: 'Tren Superior (Tracción)', exercises: [
          { name: 'Back Widows', sets: '4', reps: '10-15', note: 'Codos empujan el suelo.' },
          { name: 'Remo invertido / Deslizamiento', sets: '3', reps: '10', note: 'Tira con la espalda.' },
          { name: 'Superman holds', sets: '3', reps: '15 seg', note: 'Eleva pecho suavemente.' }
        ]},
        { day: 'Día 5', title: 'Tren Inferior y Core', exercises: [
          { name: 'Sentadilla Búlgara', sets: '3', reps: '8-12 x pierna', note: 'Pie trasero en silla.' },
          { name: 'Step-ups', sets: '3', reps: '10 x pierna', note: 'Sube a silla firme.' },
          { name: 'Wall Sit', sets: '3', reps: '45 seg', note: 'Espalda en pared.' }
        ]}
      ]
    },
    Charlotte: {
      goal: 'Tonificar glúteos/abdomen, pérdida de grasa.',
      warning: 'Cero flexión profunda de rodilla si hay dolor.',
      nutrition: {
        calories: '~1,450', protein: '110g',
        meals: [
          { time: '12:00 PM', title: 'Romper Ayuno', options: [{ name: 'Opción 1: Huevos y Tortilla', items: [{scale: '100g Huevo + 60g Claras', noScale: '2 Huevos + 2 Claras'}, {scale: '60g Tortillas', noScale: '2 Tortillas maíz'}, {scale: '100g Manzana', noScale: '1 Manzana chica'}] }, { name: 'Opción 2: Avena Proteica', items: [{scale: '40g Avena seca', noScale: '1/2 Taza avena'}, {scale: '100g Atún', noScale: '1 Lata atún'}, {scale: '15g Cacahuates', noScale: '1 Cda. cacahuates'}] }] },
          { time: '4:00 PM', title: 'Comida Principal', options: [{ name: 'Opción 1: Pollo y Arroz', items: [{scale: '120g Pollo', noScale: '1 Pechuga chica'}, {scale: '80g Arroz', noScale: '1/2 Taza arroz'}, {scale: 'Vegetales al vapor', noScale: 'Abundante brócoli'}] }, { name: 'Opción 2: Frijol y Huevo', items: [{scale: '300g Frijol', noScale: '1.5 Tazas frijol'}, {scale: '100g Huevo', noScale: '2 Huevos duros'}, {scale: 'Zanahorias', noScale: 'Zanahoria libre'}] }] },
          { time: '7:30 PM', title: 'Cierre de Ventana', options: [{ name: 'Opción 1: Atún y Ensalada', items: [{scale: '100g Atún', noScale: '1 Lata atún'}, {scale: 'Aceite oliva (7ml)', noScale: '1/2 Cda. aceite oliva'}] }, { name: 'Opción 2: Pollo Ligero', items: [{scale: '100g Pechuga', noScale: '1/2 Pechuga'}, {scale: 'Ensalada verde', noScale: 'Ensalada libre'}] }] }
        ]
      },
      workoutPlan: [
        { day: 'Día 1', title: 'Glúteos y Core', exercises: [
          { name: 'Puente de glúteo', sets: '4', reps: '15-20', note: 'Aprieta 2 seg arriba.' },
          { name: 'Frog Pumps', sets: '3', reps: '20', note: 'Suelas juntas.' },
          { name: 'Elevación lateral', sets: '3', reps: '15 x pierna', note: 'Acostada de lado.' },
          { name: 'Plancha (Plank)', sets: '3', reps: '30 seg', note: 'Abdomen apretado.' }
        ]},
        { day: 'Día 2', title: 'Tren Superior', exercises: [
          { name: 'Flexiones rodillas', sets: '3', reps: '10-15', note: 'Cojín bajo rodillas.' },
          { name: 'Back Widows', sets: '3', reps: '12', note: 'Empuja con codos.' },
          { name: 'Fondos tríceps', sets: '3', reps: '12', note: 'Espalda cerca silla.' }
        ]},
        { day: 'Día 3', title: 'Glúteo Aislado', exercises: [
          { name: 'Puente una pierna', sets: '3', reps: '12 x pierna', note: 'Empuja con talón.' },
          { name: 'Clamshells', sets: '3', reps: '15 x pierna', note: 'De lado.' },
          { name: 'Toques de talón', sets: '3', reps: '20 x lado', note: 'Boca arriba.' }
        ]},
        { day: 'Día 4', title: 'Core y Brazos', exercises: [
          { name: 'Flutter Kicks', sets: '3', reps: '30 seg', note: 'Manos bajo glúteos.' },
          { name: 'Plancha lateral', sets: '3', reps: '20 seg x lado', note: 'Oblicuos.' },
          { name: 'Superman holds', sets: '3', reps: '15 seg', note: 'Zona lumbar suave.' }
        ]},
        { day: 'Día 5', title: 'Cadera', exercises: [
          { name: 'Peso Muerto Rumano', sets: '3', reps: '15', note: 'Rodillas casi estiradas.' },
          { name: 'Puente Isométrico', sets: '3', reps: '45 seg', note: 'Mantén cadera arriba.' },
          { name: 'Elevación piernas', sets: '3', reps: '15', note: 'Piernas rectas.' }
        ]}
      ]
    },
    Eliot: {
      goal: 'Bajar peso y construir músculo.',
      warning: 'Hidrátate y consume potasio (plátano/espinaca) para evitar calambres en los pies.',
      nutrition: {
        calories: '~1,900', protein: '140g',
        meals: [
          { time: '12:00 PM', title: 'Romper Ayuno', options: [{ name: 'Opción 1: Huevos y Plátano (Potasio)', items: [{scale: '200g Huevos', noScale: '4 Huevos enteros'}, {scale: '150g Plátano', noScale: '1.5 Plátanos'}, {scale: '30g Avena', noScale: '1/3 Taza avena'}] }, { name: 'Opción 2: Batido y Tostadas', items: [{scale: '1 Scoop Proteína', noScale: '1 Scoop'}, {scale: '2 Panes integrales', noScale: '2 Rebanadas'}, {scale: '15g Crema cacahuate', noScale: '1 Cda. crema'}] }] },
          { time: '4:00 PM', title: 'Comida Principal', options: [{ name: 'Opción 1: Pollo, Frijol y Arroz', items: [{scale: '180g Pollo', noScale: '1 Pechuga'}, {scale: '150g Frijol (Magnesio)', noScale: '1 Taza frijol'}, {scale: '100g Arroz', noScale: '1/2 Taza arroz'}] }, { name: 'Opción 2: Carne magra y Papa', items: [{scale: '150g Res magra', noScale: '1 Bistec grande'}, {scale: '250g Papa cocida', noScale: '2 Papas chicas'}, {scale: 'Espinacas', noScale: 'Abundante espinaca'}] }] },
          { time: '7:30 PM', title: 'Cierre de Ventana', options: [{ name: 'Opción 1: Atún y Espinaca', items: [{scale: '150g Atún', noScale: '1.5 Latas atún'}, {scale: 'Ensalada espinaca', noScale: 'Ensalada libre'}, {scale: '15g Almendras', noScale: '1 Puñito almendras'}] }, { name: 'Opción 2: Claras y Aguacate', items: [{scale: '200g Claras', noScale: '6 Claras'}, {scale: '50g Aguacate', noScale: '1/4 Aguacate'}] }] }
        ]
      },
      workoutPlan: [
        { day: 'Día 1', title: 'Empuje (Pecho/Tríceps)', exercises: [
          { name: 'Flexiones de pecho', sets: '3', reps: '10-15', note: 'Cuerpo recto, sin arquear.' },
          { name: 'Pike Push-ups', sets: '3', reps: '8-12', note: 'Para hombros.' },
          { name: 'Fondos en silla', sets: '3', reps: '12-15', note: 'Baja controlado.' },
          { name: 'Plancha frontal', sets: '3', reps: '40 seg', note: 'Aprieta el abdomen.' }
        ]},
        { day: 'Día 2', title: 'Piernas (Sin tensión en pies)', exercises: [
          { name: 'Sentadillas', sets: '3', reps: '15', note: 'Pie completamente plano.' },
          { name: 'Zancadas estáticas', sets: '3', reps: '10 x pierna', note: 'Baja recto, suave.' },
          { name: 'Puente de glúteo', sets: '3', reps: '20', note: 'Empuja con los talones.' },
          { name: 'Wall Sit (Silla invisible)', sets: '3', reps: '45 seg', note: 'Espalda a la pared.' }
        ]},
        { day: 'Día 3', title: 'Core y Cardio', exercises: [
          { name: 'Bird-Dog', sets: '3', reps: '10 x lado', note: 'Lento y controlado.' },
          { name: 'Plancha lateral', sets: '3', reps: '30 seg x lado', note: 'Mantén la cadera arriba.' },
          { name: 'Jumping Jacks (Suaves)', sets: '3', reps: '45 seg', note: 'Si hay calambre, haz pasos laterales.' }
        ]},
        { day: 'Día 4', title: 'Tracción (Espalda/Bíceps)', exercises: [
          { name: 'Back Widows', sets: '4', reps: '15', note: 'Empuja con los codos.' },
          { name: 'Remo invertido en mesa', sets: '3', reps: '10', note: 'Usa una mesa firme.' },
          { name: 'Superman holds', sets: '3', reps: '20 seg', note: 'Tensa la espalda baja.' }
        ]},
        { day: 'Día 5', title: 'Full Body', exercises: [
          { name: 'Burpees sin salto', sets: '3', reps: '10', note: 'Evita el impacto en los pies.' },
          { name: 'Sentadilla Búlgara', sets: '3', reps: '10 x pierna', note: 'Usa una silla.' },
          { name: 'Flexiones declinadas', sets: '3', reps: '10', note: 'Pies en silla.' }
        ]}
      ]
    },
    Alejandra: {
      goal: 'Bajar peso y hacer músculo.',
      warning: 'Cuidado con la espalda baja: activa siempre el abdomen y evita cargas pesadas en la columna.',
      nutrition: {
        calories: '~1,400', protein: '100g',
        meals: [
          { time: '12:00 PM', title: 'Romper Ayuno', options: [{ name: 'Opción 1: Huevos y Avena', items: [{scale: '100g Huevos (2)', noScale: '2 Huevos enteros'}, {scale: '30g Avena', noScale: '1/3 Taza avena'}, {scale: '100g Fruta', noScale: '1 Manzana/Plátano'}] }, { name: 'Opción 2: Tostadas con Huevo', items: [{scale: '2 Rebanadas pan', noScale: '2 Panes integrales'}, {scale: '100g Huevos', noScale: '2 Huevos'}, {scale: 'Verduras', noScale: 'Al gusto'}] }] },
          { time: '4:00 PM', title: 'Comida Principal', options: [{ name: 'Opción 1: Pollo y Arroz', items: [{scale: '120g Pechuga', noScale: '1 Pechuga chica'}, {scale: '80g Arroz', noScale: '1/2 Taza arroz'}, {scale: 'Verduras verdes', noScale: 'Libre'}] }, { name: 'Opción 2: Atún y Pasta', items: [{scale: '1 Lata Atún', noScale: '1 Lata'}, {scale: '80g Pasta cocida', noScale: '1 Taza pasta'}, {scale: 'Zanahoria/Brócoli', noScale: 'Libre'}] }] },
          { time: '7:30 PM', title: 'Cierre de Ventana', options: [{ name: 'Opción 1: Ensalada Ligera', items: [{scale: '80g Pollo/Atún', noScale: 'Porción pequeña'}, {scale: 'Ensalada mixta', noScale: 'Libre'}, {scale: '10g Nueces', noScale: 'Mitad de puñado'}] }, { name: 'Opción 2: Claras de huevo', items: [{scale: '150g Claras', noScale: '5 Claras'}, {scale: 'Tomate/Cebolla', noScale: 'Al gusto'}] }] }
        ]
      },
      workoutPlan: [
        { day: 'Día 1', title: 'Glúteos y Pierna (Sin dolor lumbar)', exercises: [
          { name: 'Puente de glúteo', sets: '4', reps: '20', note: 'No arquees la espalda al subir.' },
          { name: 'Sentadilla a cajón/silla', sets: '3', reps: '15', note: 'Siéntate y levántate.' },
          { name: 'Clamshells', sets: '3', reps: '15 x pierna', note: 'Activación lateral.' },
          { name: 'Plancha apoyando rodillas', sets: '3', reps: '30 seg', note: 'Protege tu zona lumbar.' }
        ]},
        { day: 'Día 2', title: 'Tren Superior Suave', exercises: [
          { name: 'Flexiones en pared o mesa', sets: '3', reps: '12', note: 'Mantén el cuerpo recto.' },
          { name: 'Back Widows', sets: '3', reps: '12', note: 'Acostada boca arriba.' },
          { name: 'Fondos en silla (rodillas dobladas)', sets: '3', reps: '10', note: 'Sin bajar demasiado.' }
        ]},
        { day: 'Día 3', title: 'Estabilidad Core (Anti-dolor)', exercises: [
          { name: 'Bird-Dog', sets: '3', reps: '8 x lado', note: 'Excelente para dolor lumbar.' },
          { name: 'Plancha lateral (en rodillas)', sets: '3', reps: '20 seg x lado', note: 'Mantén cadera alta.' },
          { name: 'Curl-up McGill', sets: '3', reps: '10', note: 'Manos bajo espalda baja.' }
        ]},
        { day: 'Día 4', title: 'Cadera y Glúteo', exercises: [
          { name: 'Puente a una pierna', sets: '3', reps: '10 x pierna', note: 'Cuidado con la espalda.' },
          { name: 'Elevación lateral de pierna', sets: '3', reps: '20 x pierna', note: 'Acostada de lado.' },
          { name: 'Toques de talón (Heel taps)', sets: '3', reps: '20 x lado', note: 'Trabaja el abdomen inferior.' }
        ]},
        { day: 'Día 5', title: 'Cuerpo Completo', exercises: [
          { name: 'Step-ups en silla', sets: '3', reps: '10 x pierna', note: 'Controla la bajada.' },
          { name: 'Flutter Kicks', sets: '3', reps: '30 seg', note: 'Manos debajo de los glúteos.' },
          { name: 'Superman holds suave', sets: '3', reps: '15 seg', note: 'Eleva poco, sin forzar.' }
        ]}
      ]
    }
  };

  // Inyectar la opción de Batido si el perfil activo o el visualizado tiene Proteína activada en Firebase
  const profiles = JSON.parse(JSON.stringify(rawProfiles));
  Object.keys(profiles).forEach(p => {
    const pSupps = suppData[p] || { status: 'none', protein: false, creatine: false };
    if (pSupps.protein) {
      profiles[p].nutrition.meals[1].options.push({
        name: 'Opción 3 (Rápida): Batido',
        items: [{scale: '30g Proteína (1 scoop)', noScale: '1 Scoop'}, {scale: '100g Plátano', noScale: '1 Plátano'}, {scale: '15g Maní', noScale: '1 Cda. maní'}]
      });
    }
  });

  useEffect(() => {
    if (activeProfile) {
      setViewedDietProfile(activeProfile);
    }
  }, [activeProfile]);

  useEffect(() => {
    if (activeProfile && !isSyncing && initializedProfileRef.current !== activeProfile) {
      const completedDays = Object.keys(calendarData).filter(k => k.endsWith(`-${activeProfile}`) && calendarData[k]).length;
      const totalPlanDays = profiles[activeProfile].workoutPlan.length;
      setActiveDay(completedDays % totalPlanDays);
      setActiveExerciseIdx(0);
      initializedProfileRef.current = activeProfile;
    }
  }, [activeProfile, calendarData, isSyncing, profiles]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      setIsTimerRunning(false);
      playBeep();
      if (timerMode === 'work') {
        const { key, exIdx, totalSets, isBilateralTimer, side } = activeWorkSet;
        
        if (isBilateralTimer && side === 1) {
          const newSets = { ...completedSets, [key]: 1 };
          setCompletedSets(newSets);
          updateGlobalState({ completedSets: newSets });
          setActiveWorkSet(null);
        } else {
          const newSets = { ...completedSets, [key]: true };
          setCompletedSets(newSets);
          updateGlobalState({ completedSets: newSets });
          checkAndTriggerExertion(newSets, exIdx, totalSets);
          setActiveWorkSet(null);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMode, activeWorkSet]);

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
    let currentExDone = true;
    for (let i = 0; i < totalSets; i++) {
      if (newSets[`${activeProfile}-${activeDay}-${exIdx}-${i}`] !== true) {
        currentExDone = false; break;
      }
    }
    
    let dayComplete = true;
    const currentPlan = profiles[activeProfile].workoutPlan[activeDay];
    currentPlan.exercises.forEach((ex, eIdx) => {
      const tSets = parseInt(ex.sets);
      for(let i = 0; i < tSets; i++) {
        if(newSets[`${activeProfile}-${activeDay}-${eIdx}-${i}`] !== true) {
          dayComplete = false;
        }
      }
    });

    if (dayComplete) {
      setIsTimerRunning(false);
      setTimerMode('rest');
      setShowCongratsModal(true);
      markTodayCalendar();
    } else if (currentExDone) {
      setCurrentMotivation(motivaciones[Math.floor(Math.random() * motivaciones.length)]);
      setShowExertionModal(true);
    } else {
      resetTimer(60, 'rest');
    }
  };

  const handleExertionResponse = (restTime) => {
    setShowExertionModal(false);
    resetTimer(restTime, 'rest');
    const currentPlan = profiles[activeProfile].workoutPlan[activeDay];
    if (activeExerciseIdx < currentPlan.exercises.length - 1) {
      setActiveExerciseIdx(prev => prev + 1);
    }
  };

  const toggleSet = (dayIdx, exIdx, setIdx, isTimeBased, timeInSeconds, totalSets, isBilateralTimer) => {
    const key = `${activeProfile}-${dayIdx}-${exIdx}-${setIdx}`;
    const status = completedSets[key];

    if (activeWorkSet?.key === key) {
      setIsTimerRunning(false);
      setActiveWorkSet(null);
      return;
    }

    if (status === true) {
      const newSets = { ...completedSets, [key]: false };
      setCompletedSets(newSets);
      updateGlobalState({ completedSets: newSets });
      return;
    }

    if (isBilateralTimer) {
      if (!status || status === 0) {
        setTimerMode('work');
        setTimeLeft(timeInSeconds);
        setActiveWorkSet({ key, exIdx, totalSets, isBilateralTimer: true, side: 1 });
        setIsTimerRunning(true);
      } else if (status === 1) {
        setTimerMode('work');
        setTimeLeft(timeInSeconds);
        setActiveWorkSet({ key, exIdx, totalSets, isBilateralTimer: true, side: 2 });
        setIsTimerRunning(true);
      }
    } else {
      if (isTimeBased) {
        setTimerMode('work');
        setTimeLeft(timeInSeconds);
        setActiveWorkSet({ key, exIdx, totalSets, isBilateralTimer: false });
        setIsTimerRunning(true);
      } else {
        const newSets = { ...completedSets, [key]: true };
        setCompletedSets(newSets);
        updateGlobalState({ completedSets: newSets });
        checkAndTriggerExertion(newSets, exIdx, totalSets);
      }
    }
  };

  const markTodayCalendar = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const newCalendar = { ...calendarData, [`${dateStr}-${activeProfile}`]: true };
    setCalendarData(newCalendar);
    updateGlobalState({ calendarData: newCalendar });
  };

  const toggleCalendarDay = (dayNum) => {
    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const key = `${dateStr}-${activeProfile}`;
    const newCalendar = { ...calendarData, [key]: !calendarData[key] };
    setCalendarData(newCalendar);
    updateGlobalState({ calendarData: newCalendar });
  };

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const goToToday = () => setViewDate(new Date());

  const handleMealChange = (mealIndex, optionIndex) => {
    if (!viewedDietProfile) return;
    const newSelections = { ...mealSelections, [`${viewedDietProfile}-${mealIndex}`]: parseInt(optionIndex) };
    setMealSelections(newSelections);
    updateGlobalState({ mealSelections: newSelections });
  };
  const getSelectedMealOption = (mealIndex) => {
    if (!viewedDietProfile) return 0;
    return mealSelections[`${viewedDietProfile}-${mealIndex}`] || 0;
  };

  const currentSupps = suppData[viewedDietProfile] || { status: 'none', protein: false, creatine: false };
  const updateSupps = (updates) => {
    if (!viewedDietProfile) return;
    const newSuppsMap = { ...suppData, [viewedDietProfile]: { ...currentSupps, ...updates } };
    setSuppData(newSuppsMap);
    updateGlobalState({ suppData: newSuppsMap });
  };

  const handleSaveSupps = () => {
    if (currentSupps.protein || currentSupps.creatine) {
      updateSupps({ status: 'saved' });
    } else {
      updateSupps({ status: 'none' });
    }
  };

  // Funciones nuevas para el calendario corregido
  const getDaysInViewMonth = () => new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = () => new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const getEmptyDaysCount = () => {
    const firstDay = getFirstDayOfMonth();
    return firstDay === 0 ? 6 : firstDay - 1; // 0 es Domingo. Si es domingo agregamos 6 vacíos. Si es lunes (1) agregamos 0.
  };

  const viewMonthName = viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
  const actualDate = new Date();
  const isCurrentMonth = viewDate.getFullYear() === actualDate.getFullYear() && viewDate.getMonth() === actualDate.getMonth();
  
  if (isSyncing && !activeProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <Activity className="w-12 h-12 text-blue-500 mb-6 animate-spin" />
        <h1 className="text-xl font-black mb-2 animate-pulse">Sincronizando Avances...</h1>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <HeartPulse className="w-16 h-16 text-red-500 mb-6 animate-pulse" />
        <h1 className="text-4xl font-black mb-2">FitPlan Duo</h1>
        <p className="text-slate-400 mb-10 tracking-widest uppercase text-sm font-bold flex items-center gap-2">
          {dbError ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Cloud className="w-4 h-4 text-green-500" />}
          Selecciona tu perfil
        </p>
        
        <div className="w-full max-w-sm grid grid-cols-1 gap-4">
          <button onClick={() => setActiveProfile('Andros')} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-3xl font-black text-xl flex justify-between items-center transition-all active:scale-95 shadow-lg shadow-blue-900/50">
            <span>ANDROS</span><Users className="w-6 h-6 opacity-50" />
          </button>
          <button onClick={() => setActiveProfile('Charlotte')} className="w-full bg-pink-600 hover:bg-pink-700 text-white p-5 rounded-3xl font-black text-xl flex justify-between items-center transition-all active:scale-95 shadow-lg shadow-pink-900/50">
            <span>CHARLOTTE</span><Users className="w-6 h-6 opacity-50" />
          </button>
          <button onClick={() => setActiveProfile('Eliot')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-3xl font-black text-xl flex justify-between items-center transition-all active:scale-95 shadow-lg shadow-emerald-900/50">
            <span>ELIOT</span><Users className="w-6 h-6 opacity-50" />
          </button>
          <button onClick={() => setActiveProfile('Alejandra')} className="w-full bg-purple-600 hover:bg-purple-700 text-white p-5 rounded-3xl font-black text-xl flex justify-between items-center transition-all active:scale-95 shadow-lg shadow-purple-900/50">
            <span>ALEJANDRA</span><Users className="w-6 h-6 opacity-50" />
          </button>
        </div>
      </div>
    );
  }

  const currentPlan = profiles[activeProfile].workoutPlan[activeDay] || profiles[activeProfile].workoutPlan[0];
  const viewedProfileData = profiles[viewedDietProfile] || profiles[activeProfile];

  const planTotalDias = 20;
  const calculateTotalProgress = () => {
    let total = 0, done = 0;
    currentPlan.exercises.forEach((ex, exIdx) => {
      const s = parseInt(ex.sets);
      total += s;
      for(let i=0; i<s; i++) if(completedSets[`${activeProfile}-${activeDay}-${exIdx}-${i}`] === true) done++;
    });
    return total === 0 ? 0 : Math.round((done/total)*100);
  };
  
  const currentExercise = currentPlan.exercises[activeExerciseIdx];
  const isTimeBased = currentExercise.reps.toLowerCase().includes('seg') || currentExercise.reps.toLowerCase().includes('min');
  const hasSides = currentExercise.reps.toLowerCase().includes('lado') || currentExercise.reps.toLowerCase().includes('pierna');
  const isBilateralTimer = isTimeBased && hasSides; 
  
  const timeValue = parseInt(currentExercise.reps.match(/\d+/)?.[0] || 0);
  const finalTime = currentExercise.reps.toLowerCase().includes('min') ? timeValue * 60 : timeValue;
  const numSets = parseInt(currentExercise.sets);

  let formattedReps = currentExercise.reps.toUpperCase();
  if (!isTimeBased) {
    if (formattedReps.includes(' X ')) {
      formattedReps = formattedReps.replace(' X ', ' REPETICIONES X ');
    } else {
      formattedReps += ' REPETICIONES';
    }
  }

  return (
    <div className={`min-h-screen bg-slate-50 font-sans ${activeTab === 'entrenamiento' ? 'pb-44' : 'pb-24'}`}>
      
      {showCongratsModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border-4 border-yellow-400 transform transition-all text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">¡Día Completado!</h2>
            <p className="text-slate-500 font-bold mb-6">Increíble trabajo, {activeProfile}. Has finalizado tu rutina de hoy con éxito.</p>
            
            <div className="flex gap-2 w-full justify-center mb-8">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse delay-75" />
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse delay-150" />
            </div>

            <button onClick={() => { setShowCongratsModal(false); setActiveTab('progreso'); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-blue-200">
              Ver mi Progreso
            </button>
          </div>
        </div>
      )}

      {showExertionModal && !showCongratsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border-4 border-slate-100 transform transition-all">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl mb-6 flex gap-3 items-start border border-blue-100">
              <Brain className="w-8 h-8 shrink-0 text-blue-500" />
              <p className="text-xs font-black leading-relaxed italic">{currentMotivation}</p>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 text-center uppercase tracking-tight mb-2">Evaluación de Fatiga</h3>
            <p className="text-center text-sm font-bold text-slate-500 mb-6">Ajustando temporizador</p>
            
            <div className="space-y-3">
              <button onClick={() => handleExertionResponse(120)} className="w-full bg-red-50 hover:bg-red-100 text-red-700 p-4 rounded-2xl font-black border-2 border-red-200 transition-all active:scale-95 flex justify-between items-center">
                <span>ALTO (Muy cansado)</span>
                <span className="bg-red-200 px-3 py-1 rounded-full text-xs">120s</span>
              </button>
              <button onClick={() => handleExertionResponse(90)} className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 p-4 rounded-2xl font-black border-2 border-amber-200 transition-all active:scale-95 flex justify-between items-center">
                <span>MEDIO (Puedo seguir)</span>
                <span className="bg-amber-200 px-3 py-1 rounded-full text-xs">90s</span>
              </button>
              <button onClick={() => handleExertionResponse(60)} className="w-full bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-2xl font-black border-2 border-green-200 transition-all active:scale-95 flex justify-between items-center">
                <span>BAJO (Imparable)</span>
                <span className="bg-green-200 px-3 py-1 rounded-full text-xs">60s</span>
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
            <p className="text-slate-400 text-[10px] mt-0.5 uppercase font-bold tracking-widest flex items-center gap-1.5">
              {activeProfile}: {profiles[activeProfile].goal}
              {isSyncing ? <Activity className="w-3 h-3 text-amber-400 animate-spin" /> : <Cloud className="w-3 h-3 text-green-400" />}
            </p>
          </div>
          <button onClick={() => { setActiveProfile(null); initializedProfileRef.current = null; }} className="bg-slate-800 border border-slate-700 p-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-red-900/50 hover:border-red-800 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        
        {activeTab === 'entrenamiento' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className={`p-3 rounded-xl flex items-start gap-3 text-sm ${
              activeProfile==='Charlotte' ? 'bg-pink-50 border-pink-100 text-pink-800' : 
              activeProfile==='Alejandra' ? 'bg-purple-50 border-purple-100 text-purple-800' :
              activeProfile==='Eliot' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              'bg-amber-50 border-amber-100 text-amber-800'} border shadow-sm`}>
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p><strong>Aviso Técnico:</strong> {profiles[activeProfile].warning}</p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
              {profiles[activeProfile].workoutPlan.map((d, i) => (
                <button 
                  key={i} 
                  onClick={() => { setActiveDay(i); setActiveExerciseIdx(0); }} 
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all shrink-0 border ${activeDay===i ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/40' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
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
                  <p className="text-blue-600 font-black text-lg">{currentExercise.sets} SERIES x {formattedReps}</p>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">💡 {currentExercise.note}</p>
                  
                  <div className="pt-2">
                    <a 
                      href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(currentExercise.name + ' ejercicio form')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold text-sm transition-colors border-2 border-slate-200 shadow-sm active:scale-95"
                    >
                      <Search className="w-4 h-4 text-blue-500" />
                      Buscar ejemplo visual en Google
                      <ExternalLink className="w-3 h-3 opacity-50 ml-1" />
                    </a>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Toca para completar</p>
                    <div className="flex flex-wrap gap-3">
                      {Array.from({length: numSets}).map((_, sIdx) => {
                        const key = `${activeProfile}-${activeDay}-${activeExerciseIdx}-${sIdx}`;
                        const prevKey = `${activeProfile}-${activeDay}-${activeExerciseIdx}-${sIdx - 1}`;
                        
                        const status = completedSets[key];
                        // La serie está bloqueada si no es la primera Y la anterior no está marcada como completada
                        const isLocked = sIdx > 0 && completedSets[prevKey] !== true;
                        
                        const isDone = status === true;
                        const isHalfDone = status === 1;
                        const isWorking = activeWorkSet?.key === key;
                        
                        const baseClasses = `h-14 flex items-center justify-center rounded-2xl border-2 font-black transition-all shadow-sm ${!isLocked ? 'active:scale-95' : ''}`;
                        
                        let statusClasses = "";
                        if (isLocked) {
                          const widthClass = isBilateralTimer ? 'w-20' : isTimeBased ? 'w-24' : 'w-14';
                          statusClasses = `${widthClass} bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed`;
                        } else if (isWorking) {
                          statusClasses = "w-28 bg-amber-500 border-amber-600 text-white animate-pulse";
                        } else if (isDone) {
                          statusClasses = "w-14 bg-green-500 border-green-600 text-white";
                        } else if (isBilateralTimer) {
                          statusClasses = isHalfDone 
                            ? "w-20 bg-blue-100 border-blue-300 text-blue-700" 
                            : "w-20 bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50";
                        } else if (isTimeBased) {
                          statusClasses = "w-24 bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50";
                        } else {
                          statusClasses = "w-14 bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50";
                        }

                        return (
                          <button 
                            key={sIdx} 
                            disabled={isLocked}
                            onClick={() => toggleSet(activeDay, activeExerciseIdx, sIdx, isTimeBased, finalTime, numSets, isBilateralTimer)} 
                            className={`${baseClasses} ${statusClasses}`}
                          >
                            {isLocked ? (
                              <Lock className="w-5 h-5 opacity-50" />
                            ) : isWorking ? (
                              <span className="flex items-center gap-2"><Timer className="w-5 h-5"/> {timeLeft}s</span>
                            ) : isDone ? (
                              <CheckCircle2 className="w-7 h-7"/>
                            ) : isBilateralTimer ? (
                              <span className="flex items-center gap-1.5 font-mono text-lg tracking-tighter">
                                {!isHalfDone && <Play className="w-4 h-4 fill-current"/>} 
                                {isHalfDone ? '1/2' : '0/2'}
                              </span>
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
          <div className="space-y-4 animate-in fade-in duration-300">
             
             {/* Admin selector: Solo Andros puede elegir de quién ver y modificar la dieta */}
             {activeProfile === 'Andros' && (
               <div className="bg-slate-900 p-2 rounded-2xl flex gap-2 overflow-x-auto scrollbar-hide border border-slate-700 shadow-md">
                 <div className="flex items-center px-3 border-r border-slate-700">
                   <ShieldAlert className="w-5 h-5 text-amber-500" />
                 </div>
                 {Object.keys(profiles).map(p => (
                   <button 
                     key={p} 
                     onClick={() => setViewedDietProfile(p)}
                     className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${viewedDietProfile === p ? 'bg-amber-500 text-amber-950 shadow-md' : 'bg-transparent text-slate-400 hover:bg-slate-800'}`}>
                     {p}
                   </button>
                 ))}
               </div>
             )}

             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                  <Beaker className="w-5 h-5 text-indigo-500"/> Suplementación
                </h2>
                
                {currentSupps.status === 'none' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 font-bold uppercase tracking-tighter leading-tight">¿Consumes suplementos?</span>
                      <button onClick={() => updateSupps({ status: 'taking' })} className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Sí, Activar</button>
                    </div>
                    <button onClick={() => updateSupps({ status: 'suggest' })} className="w-full bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 tracking-widest">
                      <Info className="w-4 h-4" /> Ver Sugerencias
                    </button>
                  </div>
                )}

                {currentSupps.status === 'taking' && (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={currentSupps.protein} onChange={e => updateSupps({protein: e.target.checked})} className="w-6 h-6 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"/>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">Proteína en Polvo (Whey)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={currentSupps.creatine} onChange={e => updateSupps({creatine: e.target.checked})} className="w-6 h-6 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"/>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">Creatina (5g Diarios)</span>
                      </label>
                    </div>
                    <button onClick={handleSaveSupps} className="mt-4 text-[10px] text-indigo-600 font-black uppercase tracking-widest underline decoration-2">Guardar Selección</button>
                  </div>
                )}

                {currentSupps.status === 'saved' && (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex justify-between items-center shadow-inner">
                    <div>
                      <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Consumiendo</p>
                      <p className="text-sm font-bold text-indigo-900 leading-tight">
                        {currentSupps.protein && "Proteína Whey"}
                        {currentSupps.protein && currentSupps.creatine && " + "}
                        {currentSupps.creatine && "Creatina"}
                      </p>
                    </div>
                    <button onClick={() => updateSupps({ status: 'taking' })} className="bg-white border border-indigo-200 text-indigo-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm active:scale-95 transition-all">Editar</button>
                  </div>
                )}

                {currentSupps.status === 'suggest' && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <ul className="text-xs text-amber-800 space-y-2 font-bold leading-relaxed mb-4">
                      <li>• <strong>Proteína:</strong> Si no llegas a tu meta diaria con comida.</li>
                      <li>• <strong>Creatina:</strong> Confiable para fuerza y recuperación.</li>
                    </ul>
                    <div className="flex gap-2">
                      <button onClick={() => updateSupps({ status: 'taking' })} className="flex-1 bg-amber-200 text-amber-900 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95">Configurar</button>
                      <button onClick={() => updateSupps({ status: 'none' })} className="flex-1 bg-white text-amber-700 border border-amber-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95">Ocultar</button>
                    </div>
                  </div>
                )}
             </div>

             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative">
                
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                    <Apple className="w-5 h-5 text-red-500"/> Plan Base
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Calorías</p>
                    <p className="text-xl font-bold text-slate-800">{viewedProfileData.nutrition.calories}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Proteína</p>
                    <p className="text-xl font-bold text-blue-600">{viewedProfileData.nutrition.protein}</p>
                  </div>
                </div>

                <div className="flex bg-slate-100 rounded-lg overflow-hidden h-8 mb-6 border border-slate-200">
                  <div className="w-2/3 bg-slate-800 text-[10px] text-white flex items-center justify-center font-bold uppercase tracking-widest">Ayuno (16h)</div>
                  <div className="w-1/3 bg-green-500 text-[10px] text-white flex items-center justify-center font-bold uppercase tracking-widest">Comida (8h)</div>
                </div>
                
                <div className="space-y-4">
                  {viewedProfileData.nutrition.meals.map((meal, mIdx) => {
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
                              <span>{it.scale === it.noScale ? it.scale : `${it.scale} (${it.noScale})`}</span>
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
          <div className="space-y-4 animate-in fade-in duration-300">
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <h2 className="font-black text-xl text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                  <Target className="w-6 h-6 text-indigo-600" /> Avance Global
                </h2>
                <p className="text-[10px] font-bold mt-1 uppercase tracking-widest text-slate-500">
                  En tiempo real (Meta: {planTotalDias})
                </p>
              </div>
              <div className="p-5 space-y-5">
                {Object.keys(profiles).map(profileName => {
                  const completados = Object.keys(calendarData).filter(k => k.endsWith(`-${profileName}`) && calendarData[k]).length;
                  const pct = Math.min(100, Math.round((completados / planTotalDias) * 100));
                  
                  const colorClass = 
                    profileName === 'Andros' ? 'bg-blue-500' :
                    profileName === 'Charlotte' ? 'bg-pink-500' :
                    profileName === 'Eliot' ? 'bg-emerald-500' : 'bg-purple-500';

                  return (
                    <div key={profileName}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-bold text-slate-700 uppercase flex items-center gap-1">
                          {profileName} {profileName === activeProfile && <span className="text-[8px] bg-slate-200 px-1.5 py-0.5 rounded-full">TÚ</span>}
                        </span>
                        <span className="text-xs font-black text-slate-500">{completados}/{planTotalDias}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                        <div className={`${colorClass} h-full rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
                <div>
                  <h2 className="font-black text-xl text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-blue-600" /> Registro
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{viewMonthName}</p>
                    {!isCurrentMonth && (
                      <button onClick={goToToday} className="text-[9px] font-black uppercase tracking-widest bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded-md transition-colors active:scale-95">
                        HOY
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition-all hover:bg-slate-100">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextMonth} 
                    disabled={isCurrentMonth}
                    className={`w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center transition-all ${isCurrentMonth ? 'text-slate-300 opacity-50 cursor-not-allowed' : 'text-slate-600 active:scale-95 hover:bg-slate-100'}`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-7 gap-2">
                  {/* Encabezado de los días de la semana */}
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                    <div key={`header-${i}`} className="text-center text-[10px] font-black text-slate-400 uppercase">{day}</div>
                  ))}
                  
                  {/* Espacios vacíos para alinear el primer día del mes */}
                  {Array.from({ length: getEmptyDaysCount() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  ))}

                  {/* Días reales del mes */}
                  {Array.from({length: getDaysInViewMonth()}).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isDone = calendarData[`${dateStr}-${activeProfile}`];
                    
                    const isToday = viewDate.getFullYear() === actualDate.getFullYear() && viewDate.getMonth() === actualDate.getMonth() && dayNum === actualDate.getDate();
                    
                    const targetDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum);
                    targetDate.setHours(0,0,0,0);
                    const todayDateZero = new Date(actualDate);
                    todayDateZero.setHours(0,0,0,0);
                    const isFuture = targetDate > todayDateZero;

                    return (
                      <button 
                        key={`day-${i}`}
                        onClick={() => {
                          if (!isFuture) toggleCalendarDay(dayNum);
                        }}
                        disabled={isFuture}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl font-black text-sm transition-all border-2 
                          ${isFuture ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' : 
                            isDone ? 'bg-green-500 border-green-600 text-white shadow-sm active:scale-90' : 
                            isToday ? 'bg-blue-50 border-blue-200 text-blue-700 active:scale-90' : 
                            'bg-white border-slate-100 text-slate-600 hover:border-slate-300 active:scale-90'}`}
                      >
                        {dayNum}
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

      {activeTab === 'entrenamiento' && !showCongratsModal && (
        <div className="fixed bottom-[80px] left-0 right-0 p-3 pointer-events-none z-30">
          <div className={`max-w-[350px] mx-auto rounded-full shadow-2xl p-2 pl-3 flex items-center justify-between pointer-events-auto border transition-all backdrop-blur-md ${timerMode==='work'?'bg-red-600/80 border-red-500/50 shadow-red-500/40':'bg-slate-900/80 border-slate-700/50'} text-white`}>
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${timerMode==='work'?'bg-red-500':'bg-slate-800'}`}>
                <Timer className={`w-5 h-5 ${isTimerRunning?'animate-pulse':''}`}/>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">{timerMode==='work'?'🔥 Esfuerzo':'☕ Descanso'}</span>
                <span className="text-2xl font-mono font-black tabular-nums leading-none">{formatTime(timeLeft)}</span>
              </div>
            </div>
            
            <div className="flex gap-2 items-center pr-1">
              {timerMode === 'rest' && (
                <>
                  <button onClick={() => resetTimer(60)} className="h-9 px-3.5 bg-slate-800 hover:bg-slate-700 rounded-full font-black text-[10px] border border-slate-700 transition-colors uppercase tracking-widest active:scale-95">60s</button>
                  <button onClick={() => resetTimer(90)} className="h-9 px-3.5 bg-slate-800 hover:bg-slate-700 rounded-full font-black text-[10px] border border-slate-700 transition-colors uppercase tracking-widest active:scale-95">90s</button>
                </>
              )}
              <button onClick={toggleTimer} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isTimerRunning?'bg-amber-500 text-amber-950':'bg-white text-slate-900 shadow-lg active:scale-90'}`}>
                {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor"/>}
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