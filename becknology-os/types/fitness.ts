// Fitness Types for Health Coach

export interface Workout {
  id: string
  user_id: string
  date: string
  type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
  name: string
  duration_minutes: number
  exercises: Exercise[]
  notes: string | null
  energy_level: 1 | 2 | 3 | 4 | 5
  completed: boolean
  created_at: string
}

export interface Exercise {
  name: string
  sets?: number
  reps?: number
  weight?: number
  duration_seconds?: number
  notes?: string
}

export interface WorkoutInsert {
  user_id?: string
  date: string
  type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
  name: string
  duration_minutes: number
  exercises: Exercise[]
  notes?: string | null
  energy_level?: 1 | 2 | 3 | 4 | 5
  completed?: boolean
}

export interface Supplement {
  id: string
  user_id: string
  name: string
  dosage: string
  timing: 'morning' | 'afternoon' | 'evening' | 'with_meals' | 'before_bed'
  frequency: 'daily' | 'weekly' | 'as_needed'
  purpose: string | null
  active: boolean
  created_at: string
}

export interface SupplementLog {
  id: string
  user_id: string
  supplement_id: string
  taken_at: string
  notes: string | null
}

export interface HealthMetric {
  id: string
  user_id: string
  date: string
  type: 'weight' | 'blood_pressure' | 'heart_rate' | 'sleep_hours' | 'steps' | 'body_fat' | 'water_intake'
  value: number
  secondary_value?: number // for blood pressure (systolic/diastolic)
  notes: string | null
  created_at: string
}

export interface MorningRoutine {
  id: string
  user_id: string
  date: string
  wake_time: string
  items_completed: Record<string, boolean>
  notes: string | null
  mood_rating: 1 | 2 | 3 | 4 | 5
  created_at: string
}

export interface MorningRoutineItem {
  id: string
  label: string
  category: 'hydration' | 'movement' | 'mindfulness' | 'hygiene' | 'nutrition'
  order: number
}

// Health test recommendations for 38-year-old male
export interface HealthTest {
  id: string
  name: string
  description: string
  frequency: string
  lastDone: string | null
  nextDue: string | null
  importance: 'critical' | 'important' | 'recommended'
}

export const RECOMMENDED_HEALTH_TESTS: HealthTest[] = [
  {
    id: 'annual_physical',
    name: 'Annual Physical Exam',
    description: 'Comprehensive health checkup including blood pressure, heart, lungs, and general health assessment',
    frequency: 'Annually',
    lastDone: null,
    nextDue: null,
    importance: 'critical',
  },
  {
    id: 'blood_panel',
    name: 'Complete Blood Panel',
    description: 'CBC, metabolic panel, lipid panel, A1C. Check cholesterol, blood sugar, kidney/liver function',
    frequency: 'Annually',
    lastDone: null,
    nextDue: null,
    importance: 'critical',
  },
  {
    id: 'testosterone',
    name: 'Testosterone Levels',
    description: 'Total and free testosterone. Important for men over 35',
    frequency: 'Annually',
    lastDone: null,
    nextDue: null,
    importance: 'important',
  },
  {
    id: 'thyroid',
    name: 'Thyroid Panel (TSH, T3, T4)',
    description: 'Check thyroid function - affects metabolism, energy, and mood',
    frequency: 'Every 2-3 years',
    lastDone: null,
    nextDue: null,
    importance: 'important',
  },
  {
    id: 'vitamin_d',
    name: 'Vitamin D Levels',
    description: 'Most adults are deficient. Crucial for immune function and bone health',
    frequency: 'Annually',
    lastDone: null,
    nextDue: null,
    importance: 'important',
  },
  {
    id: 'dental',
    name: 'Dental Checkup & Cleaning',
    description: 'Professional cleaning and oral health examination',
    frequency: 'Every 6 months',
    lastDone: null,
    nextDue: null,
    importance: 'important',
  },
  {
    id: 'eye_exam',
    name: 'Comprehensive Eye Exam',
    description: 'Vision check and eye health screening. More important after 40',
    frequency: 'Every 2 years',
    lastDone: null,
    nextDue: null,
    importance: 'recommended',
  },
  {
    id: 'skin_check',
    name: 'Dermatology Skin Check',
    description: 'Full body skin cancer screening. Important if you have moles or sun exposure',
    frequency: 'Annually',
    lastDone: null,
    nextDue: null,
    importance: 'recommended',
  },
  {
    id: 'colonoscopy',
    name: 'Colonoscopy',
    description: 'Colon cancer screening. Guidelines now recommend starting at 45',
    frequency: 'Every 10 years (or as advised)',
    lastDone: null,
    nextDue: null,
    importance: 'important',
  },
]

export const DEFAULT_MORNING_ROUTINE: MorningRoutineItem[] = [
  { id: 'water', label: 'Drink 16oz water', category: 'hydration', order: 1 },
  { id: 'stretch', label: '5-minute stretch', category: 'movement', order: 2 },
  { id: 'meditation', label: '10-minute meditation', category: 'mindfulness', order: 3 },
  { id: 'cold_shower', label: 'Cold shower (last 30 sec)', category: 'hygiene', order: 4 },
  { id: 'supplements', label: 'Take morning supplements', category: 'nutrition', order: 5 },
  { id: 'breakfast', label: 'Protein-rich breakfast', category: 'nutrition', order: 6 },
  { id: 'journal', label: 'Write 3 priorities for today', category: 'mindfulness', order: 7 },
]

export interface FitnessStats {
  workoutsThisWeek: number
  workoutsThisMonth: number
  currentStreak: number
  supplementsToday: number
  supplementsTotal: number
  morningRoutineComplete: boolean
  averageEnergyLevel: number
}
