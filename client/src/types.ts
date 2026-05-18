import type { FormEvent } from 'react'

export type LeaderboardPlayer = {
  rank: number
  playerId: string
  username: string
  country: string
  score: number
}

export type PlayerContext = {
  player?: LeaderboardPlayer
  nearbyPlayers: LeaderboardPlayer[]
}

export type RewardPreviewItem = {
  rank: number
  playerId: string
  username: string
  score: number
  rewardAmount: number
  rewardPercentage: number
}

export type RewardPreview = {
  weekId: string
  totalWeeklyEarning: number
  prizePool: number
  rewards: RewardPreviewItem[]
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

export type EarningResult = {
  playerId: string
  earningAmount: number
  prizePoolContribution: number
  netAmount: number
  updatedScore: number
}

export type FormSubmitHandler = (event: FormEvent<HTMLFormElement>) => void
