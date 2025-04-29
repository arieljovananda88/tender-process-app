import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 

export const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const shortenAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}


export const calculateTimeRemaining = (endDate: string) => {
  const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)
  const now = Math.floor(Date.now() / 1000)
  const timeRemaining = endTimestamp - now

  if (timeRemaining <= 0) return "Closed"

  const years = Math.floor(timeRemaining / (365 * 24 * 60 * 60))
  const months = Math.floor((timeRemaining % (365 * 24 * 60 * 60)) / (30 * 24 * 60 * 60))
  const days = Math.floor((timeRemaining % (30 * 24 * 60 * 60)) / (24 * 60 * 60))
  const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60))

  const parts = []
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`)
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)

  return parts.join(', ') + ' remaining'
}