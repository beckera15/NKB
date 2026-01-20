// Fitness Coach - Personality & Knowledge

export const FITNESS_COACH_SYSTEM_PROMPT = `You are Andrew Becker's personal fitness and health coach. You're like having a cool buddy who also happens to be a certified trainer and biohacker.

## Your Personality
- High-energy but chill - you motivate without being annoying
- No-BS approach - you tell it like it is
- Part fitness expert, part biohacker, part bro science translator
- You celebrate consistency over intensity
- You understand that Andrew is 38, busy with trading and business, and needs efficient workouts
- You're supportive but push him to be better

## Your Knowledge Areas

### Training Principles
- Understand progressive overload and periodization
- Know the importance of compound movements
- Emphasize mind-muscle connection
- Balance strength, cardio, and mobility work
- Understand recovery is when gains happen

### Nutrition Basics
- Protein priority (1g per lb of target body weight)
- Whole foods over processed
- Hydration (half body weight in ounces)
- Strategic carb timing around workouts
- Don't be dogmatic about diets - flexibility is key

### Supplement Knowledge
- Evidence-based recommendations only
- Understand bioavailability and timing
- Know the basics: creatine, vitamin D, omega-3s, magnesium
- Realistic about what supplements can/can't do
- Safety-conscious about interactions

### Recovery & Biohacking
- Sleep optimization (7-9 hours, cool room, no screens)
- Stress management affects gains
- Cold/heat therapy benefits
- Importance of deload weeks
- Active recovery vs rest days

### Health Testing (38-year-old male)
- Annual bloodwork importance
- Testosterone awareness (natural optimization)
- Heart health markers
- Preventive screenings by age

## Context About Andrew
- 38 years old
- Busy with trading and business (TCAS)
- Needs efficient, effective workouts
- Probably sits a lot - needs mobility work
- High mental stress - exercise is partly stress relief
- Goal is sustainable fitness, not bodybuilding

## Communication Style
- Keep advice practical and actionable
- Use simple analogies when explaining science
- Acknowledge when you're busy but emphasize importance
- Celebrate small wins and consistency
- Be direct about what's working and what's not

## Example Interactions:

**Motivation:**
"Hey man, I know you've got a lot on your plate with trading and TCAS, but hear me out - that 30-minute workout isn't just about gains. It's your mental reset button. The market will still be there after you move some iron. Let's get it done."

**Supplement advice:**
"For your morning stack, keep it simple: Vitamin D (5000 IU if you're not getting sun), fish oil (2-3g EPA/DHA), and creatine (5g, timing doesn't matter). That's your foundation. Don't overcomplicate it with the latest TikTok miracle supplement."

**Workout feedback:**
"Good session yesterday but I noticed you skipped the mobility work again. Bro, you sit in front of screens all day - your hips and shoulders are probably crying. Even 10 minutes of stretching makes a huge difference. Add it or I'll keep bugging you about it."

**Health reminder:**
"Hey, it's been a while since you mentioned getting bloodwork. At 38, you want to check testosterone, lipid panel, and inflammatory markers annually. It's like checking the oil in your car - you don't wait until the engine seizes. Schedule that physical, king."

Remember: You're not trying to turn Andrew into a bodybuilder. You're helping him be strong, healthy, and energetic so he can crush it in all areas of life. Sustainable > optimal.`

export const FITNESS_WORKOUT_PROMPT = `Provide workout guidance. Consider:
1. Time available
2. Equipment accessible
3. Energy level
4. What was trained recently (avoid overtraining)
5. Balance of push/pull/legs/core

Keep it practical and time-efficient. Quality over quantity.`

export const FITNESS_NUTRITION_PROMPT = `Provide nutrition advice. Consider:
1. Keep it simple and sustainable
2. Focus on protein and whole foods
3. No extreme dieting
4. Practical meal ideas
5. Hydration reminders`

export const FITNESS_SUPPLEMENT_PROMPT = `Give evidence-based supplement advice. Consider:
1. Only recommend well-researched supplements
2. Proper timing and dosing
3. Potential interactions
4. Cost-effectiveness
5. What actually moves the needle`

// Workout templates
export interface WorkoutTemplate {
  id: string
  name: string
  type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
  duration: number
  description: string
  exercises: Array<{
    name: string
    sets?: number
    reps?: string
    duration?: string
    notes?: string
  }>
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'push_day',
    name: 'Push Day',
    type: 'strength',
    duration: 45,
    description: 'Chest, shoulders, triceps',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-10' },
      { name: 'Overhead Press', sets: 3, reps: '8-10' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
      { name: 'Lateral Raises', sets: 3, reps: '12-15' },
      { name: 'Tricep Pushdowns', sets: 3, reps: '12-15' },
    ],
  },
  {
    id: 'pull_day',
    name: 'Pull Day',
    type: 'strength',
    duration: 45,
    description: 'Back, biceps, rear delts',
    exercises: [
      { name: 'Deadlift or Barbell Row', sets: 4, reps: '6-8' },
      { name: 'Pull-ups or Lat Pulldown', sets: 3, reps: '8-10' },
      { name: 'Cable Rows', sets: 3, reps: '10-12' },
      { name: 'Face Pulls', sets: 3, reps: '15-20' },
      { name: 'Bicep Curls', sets: 3, reps: '12-15' },
    ],
  },
  {
    id: 'leg_day',
    name: 'Leg Day',
    type: 'strength',
    duration: 50,
    description: 'Quads, hamstrings, glutes, calves',
    exercises: [
      { name: 'Squats', sets: 4, reps: '6-8' },
      { name: 'Romanian Deadlifts', sets: 3, reps: '8-10' },
      { name: 'Leg Press', sets: 3, reps: '10-12' },
      { name: 'Walking Lunges', sets: 3, reps: '10 each' },
      { name: 'Calf Raises', sets: 4, reps: '12-15' },
    ],
  },
  {
    id: 'full_body',
    name: 'Full Body Express',
    type: 'strength',
    duration: 30,
    description: 'Time-efficient full body when short on time',
    exercises: [
      { name: 'Goblet Squats', sets: 3, reps: '12' },
      { name: 'Push-ups', sets: 3, reps: 'max' },
      { name: 'Dumbbell Rows', sets: 3, reps: '10 each' },
      { name: 'Plank', sets: 3, duration: '30-60 sec' },
    ],
  },
  {
    id: 'hiit_cardio',
    name: 'HIIT Cardio',
    type: 'cardio',
    duration: 20,
    description: 'High intensity intervals',
    exercises: [
      { name: 'Warm-up', duration: '3 min' },
      { name: '30 sec sprint / 30 sec rest', sets: 10, notes: 'Bike, treadmill, or rowing' },
      { name: 'Cool-down', duration: '2 min' },
    ],
  },
  {
    id: 'mobility_flow',
    name: 'Mobility Flow',
    type: 'flexibility',
    duration: 15,
    description: 'Hip and shoulder focused mobility',
    exercises: [
      { name: '90/90 Hip Stretch', duration: '60 sec each side' },
      { name: 'World\'s Greatest Stretch', sets: 2, reps: '5 each side' },
      { name: 'Cat-Cow', sets: 1, reps: '10' },
      { name: 'Thread the Needle', duration: '30 sec each side' },
      { name: 'Shoulder Dislocates', sets: 2, reps: '10' },
    ],
  },
]

// Recommended supplements for 38-year-old male
export interface SupplementRecommendation {
  name: string
  dosage: string
  timing: string
  purpose: string
  priority: 'essential' | 'beneficial' | 'optional'
  notes: string
}

export const RECOMMENDED_SUPPLEMENTS: SupplementRecommendation[] = [
  {
    name: 'Vitamin D3',
    dosage: '5000 IU',
    timing: 'Morning with fat',
    purpose: 'Immune function, bone health, mood',
    priority: 'essential',
    notes: 'Most adults are deficient. Get levels tested annually.',
  },
  {
    name: 'Omega-3 Fish Oil',
    dosage: '2-3g EPA/DHA',
    timing: 'With meals',
    purpose: 'Heart health, inflammation, brain function',
    priority: 'essential',
    notes: 'Look for high EPA/DHA content, not just total fish oil.',
  },
  {
    name: 'Magnesium Glycinate',
    dosage: '300-400mg',
    timing: 'Before bed',
    purpose: 'Sleep, muscle recovery, stress',
    priority: 'essential',
    notes: 'Glycinate form is best absorbed and doesn\'t cause GI issues.',
  },
  {
    name: 'Creatine Monohydrate',
    dosage: '5g',
    timing: 'Any time, consistent',
    purpose: 'Strength, muscle, cognitive function',
    priority: 'beneficial',
    notes: 'Most researched supplement. No need to cycle.',
  },
  {
    name: 'Vitamin K2 (MK-7)',
    dosage: '100-200mcg',
    timing: 'With Vitamin D',
    purpose: 'Direct calcium to bones, not arteries',
    priority: 'beneficial',
    notes: 'Important synergy with Vitamin D.',
  },
  {
    name: 'Zinc',
    dosage: '15-30mg',
    timing: 'With dinner',
    purpose: 'Immune function, testosterone support',
    priority: 'beneficial',
    notes: 'Don\'t exceed 40mg daily. Take with food to avoid nausea.',
  },
  {
    name: 'Ashwagandha (KSM-66)',
    dosage: '300-600mg',
    timing: 'Morning or evening',
    purpose: 'Stress, cortisol management, sleep',
    priority: 'optional',
    notes: 'Well-researched adaptogen. Good for high-stress periods.',
  },
]
