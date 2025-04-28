interface CardContainerProps {
  children: React.ReactNode
  className?: string
}

export function CardContainer({ children, className = "" }: CardContainerProps) {
  return <div className={`bg-white border rounded-lg shadow-sm p-6 ${className}`}>{children}</div>
}
