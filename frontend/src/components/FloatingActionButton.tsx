import React from 'react'
import { Plus, Zap } from 'lucide-react'

interface FloatingActionButtonProps {
  onClick?: () => void
  icon?: React.ReactNode
  className?: string
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  icon = <Plus className="h-6 w-6" />,
  className = ""
}) => {
  return (
    <button 
      onClick={onClick}
      className={`fab ${className}`}
      aria-label="Quick Action"
    >
      {icon}
    </button>
  )
}

export default FloatingActionButton