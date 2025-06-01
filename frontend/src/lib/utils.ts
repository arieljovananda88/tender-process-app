import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 

export const formatDate = (timestamp: string, type: string = "int") => {
  const date = type !== 'string' 
    ? new Date(Number(timestamp) * 1000)
    : new Date(timestamp);
    
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const shortenAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}


export const calculateTimeRemaining = (endDate: string) => {
  const endTimestamp = Math.floor(new Date(Number(endDate) * 1000).getTime() / 1000)
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

export const createTenderQuery = (search: string = "", page: number = 0, pageSize: number = 10) => {
  let condition = ""
  if (search) {
    condition = `where: {name: "${search}" }`
  }
  const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
  return `
    query Subgraphs {
      tenderCreateds(${pagination}, ${condition}) {
        id
        tenderId
        owner
        name
        description
        startDate
        endDate
      }
    }
  `
}

export const createMyTenderQuery = (address: string, search: string = "", page: number = 0, pageSize: number = 10) => {
  let condition = ""
  if (address) {
    condition = `where: {owner: "${address}" }`
  }
  if (search) {
    condition = `where: {owner: "${address}", name: "${search}" }`
  }
  const pagination = `first: ${pageSize}, skip: ${page * pageSize}`
  return `
    query Subgraphs {
      tenderCreateds(${pagination}, ${condition}) {
        id
        tenderId
        owner
        name
        description
        startDate
        endDate
      }
    }
  `
}

export const createTenderByIDQuery = (id: string) => {
  return `
    query Subgraphs {
      tenderCreateds(where: {tenderId: "${id}"}) {
        id
        tenderId
        owner
        name
        description
        startDate
        endDate
      }
    }
  `
}

export const createPendingParticipantQuery = (id: string, page: number = 0) => {
  const pageSize = 10
  return `
  query Subgraphs {
    pendingParticipantAddeds(
      where: { tenderId: "${id}" }
      first: ${pageSize}
      skip: ${page * pageSize}
    ) {
      participant
      name
    }
  }
`;
}

export const createParticipantQuery = (id: string, page: number = 0) => {
  const pageSize = 10
  return `
  query Subgraphs {
    participantAddeds(
      where: { tenderId: "${id}" }
      first: ${pageSize}
      skip: ${page * pageSize}
    ) {
      participant
      name
    }
  }
`;
}

export const createUserQuery = (address: string) => {
  return `
    query Subgraphs {
      publicKeyStoreds(where: {walletAddress: "${address}"}) {
        email
        name
      }
    }
  `
}