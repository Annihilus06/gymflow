import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodayWorkoutCard } from '@/components/dashboard/TodayWorkoutCard';
import { WeeklyFrequencyCard } from '@/components/dashboard/WeeklyFrequencyCard';
import { ActiveGoalWidget } from '@/components/dashboard/ActiveGoalWidget';
import { BiometricsOverview } from '@/components/dashboard/BiometricsOverview';
import { DashboardCalendar } from '@/components/dashboard/DashboardCalendar';
import type { CalendarDayEvent, WeeklyScheduleResponse } from '@/lib/services/calendar.service';
import type { GoalWithCalculatedProgress } from '@/lib/services/goal.service';
import type { ProgressSummary } from '@/lib/services/progress.service';
import type { UserProfileResponse } from '@/lib/services/profile.service';

describe('Dashboard Modular UI Components', () => {
  describe('TodayWorkoutCard', () => {
    it('renders empty routine state with CTA when user has no active routine', () => {
      render(<TodayWorkoutCard hasActiveRoutine={false} />);
      expect(screen.getByText(/Ready to Train Today\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Start Today's Workout/i)).toBeInTheDocument();
    });

    it('renders recovery card when today is a rest day', () => {
      const restDay: CalendarDayEvent = {
        dateStr: '2026-08-24',
        dayNumber: 24,
        dayOfWeek: 'MONDAY',
        isCurrentMonth: true,
        isToday: true,
        isRestDay: true,
        status: 'REST',
        label: 'Recovery Day',
        exerciseCount: 0,
        exercises: [],
      };

      render(<TodayWorkoutCard todayDay={restDay} hasActiveRoutine={true} />);
      expect(screen.getByText(/Scheduled Recovery Day/i)).toBeInTheDocument();
      expect(screen.getByText(/Rest & Recovery/i)).toBeInTheDocument();
    });

    it('renders workout focus card with Start Workout CTA when exercises are scheduled', () => {
      const workoutDay: CalendarDayEvent = {
        dateStr: '2026-08-24',
        dayNumber: 24,
        dayOfWeek: 'MONDAY',
        isCurrentMonth: true,
        isToday: true,
        isRestDay: false,
        status: 'UPCOMING',
        label: 'Push Day - Chest & Triceps',
        exerciseCount: 4,
        exercises: [
          {
            id: 'e1',
            name: 'Barbell Bench Press',
            category: 'STRENGTH',
            primaryMuscle: 'Chest',
            defaultSets: 4,
            defaultReps: 8,
            defaultWeightKg: 80,
            displayOrder: 0,
            notes: null,
          },
        ],
      };

      render(<TodayWorkoutCard todayDay={workoutDay} hasActiveRoutine={true} />);
      expect(screen.getByText(/Push Day - Chest & Triceps/i)).toBeInTheDocument();
      expect(screen.getByText(/Barbell Bench Press/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start today's workout/i })).toBeInTheDocument();
    });
  });

  describe('WeeklyFrequencyCard', () => {
    it('renders frequency percentage and active streak', () => {
      const mockStats: ProgressSummary = {
        period: 'week',
        startDate: '2026-08-24',
        endDate: '2026-08-30',
        plannedWorkouts: 5,
        completedWorkouts: 4,
        missedWorkouts: 1,
        frequencyPct: 80,
        streak: 3,
        consistencyScore: 79,
        totalVolume: { value: 12000, unit: 'kg', display: '12,000 kg' },
        totalDurationSecs: 7200,
        muscleGroupBreakdown: [],
      };

      render(<WeeklyFrequencyCard stats={mockStats} />);
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText(/4 of 5 planned workouts completed/i)).toBeInTheDocument();
      expect(screen.getByText(/3 days streak/i)).toBeInTheDocument();
    });
  });

  describe('ActiveGoalWidget', () => {
    it('renders active goal progress bar and days remaining', () => {
      const mockGoal: GoalWithCalculatedProgress = {
        id: 'g1',
        userId: 'u1',
        type: 'WEIGHT_LOSS',
        status: 'ACTIVE',
        title: 'Lose 5 kg for Summer',
        description: null,
        startValue: 85,
        currentValue: 82.5,
        targetValue: 80,
        unit: 'kg',
        targetDate: new Date('2026-12-31'),
        startedAt: new Date('2026-08-01'),
        completedAt: null,
        createdAt: new Date('2026-08-01'),
        updatedAt: new Date('2026-08-24'),
        progressPct: 50,
        daysRemaining: 129,
        trackStatus: 'ON_TRACK',
      };

      render(<ActiveGoalWidget activeGoal={mockGoal} />);
      expect(screen.getByText('Lose 5 kg for Summer')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText(/82.5 \/ 80 kg/i)).toBeInTheDocument();
    });
  });

  describe('BiometricsOverview', () => {
    it('renders BMI, Calorie target, and Protein target', () => {
      const mockProfileData: UserProfileResponse = {
        id: 'u1',
        name: 'Alex',
        email: 'alex@example.com',
        image: null,
        profile: {
          id: 'p1',
          userId: 'u1',
          dateOfBirth: new Date('1996-08-24'),
          sex: 'MALE',
          heightCm: 180,
          weightUnit: 'KG',
          activityLevel: 'MODERATELY_ACTIVE',
          experienceLevel: 'INTERMEDIATE',
          onboardingComplete: true,
          notificationsEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        metrics: {
          currentWeightKg: 80,
          bmi: 24.69,
          bmiCategory: 'Normal weight',
          age: 30,
          bmr: 1780,
          tdee: 2759,
          dailyCalorieTarget: 2259,
          dailyProteinTargetG: 176,
        },
      };

      render(<BiometricsOverview profileData={mockProfileData} />);
      expect(screen.getByText('80 kg')).toBeInTheDocument();
      expect(screen.getByText('24.69')).toBeInTheDocument();
      expect(screen.getByText('Normal weight')).toBeInTheDocument();
      expect(screen.getByText('2259 kcal')).toBeInTheDocument();
      expect(screen.getByText('176 g')).toBeInTheDocument();
    });
  });

  describe('DashboardCalendar', () => {
    it('triggers onSelectDate when a day is clicked', () => {
      const onSelect = vi.fn();
      const mockSchedule: WeeklyScheduleResponse = {
        activeRoutine: { id: 'r1', name: '4-Day Split' },
        startDate: '2026-08-24',
        endDate: '2026-08-30',
        todayStr: '2026-08-24',
        days: [
          {
            dateStr: '2026-08-24',
            dayNumber: 24,
            dayOfWeek: 'MONDAY',
            isCurrentMonth: true,
            isToday: true,
            isRestDay: false,
            status: 'UPCOMING',
            label: 'Chest Day',
            exerciseCount: 3,
            exercises: [],
          },
        ],
      };

      render(
        <DashboardCalendar
          schedule={mockSchedule}
          selectedDateStr="2026-08-24"
          onSelectDate={onSelect}
        />
      );

      const dayButton = screen.getByLabelText(/View schedule for MONDAY/i);
      fireEvent.click(dayButton);
      expect(onSelect).toHaveBeenCalledWith('2026-08-24');
    });
  });
});
