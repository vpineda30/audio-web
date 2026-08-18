'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PRESET_COLORS = [
  '#EF4444', // Vermelho
  '#F97316', // Laranja
  '#F59E0B', // Amarelo
  '#10B981', // Verde
  '#06B6D4', // Ciano
  '#3B82F6', // Azul
  '#6366F1', // Indigo
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
  '#64748B', // Cinza
]

interface ColorPickerProps {
  selectedColor: string
  onSelectColor: (color: string) => void
}

export function ColorPickerPopover({ selectedColor, onSelectColor }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempColor, setTempColor] = useState(selectedColor)

  useEffect(() => {
    setTempColor(selectedColor)
  }, [selectedColor, isOpen])

  function handleConfirm() {
    onSelectColor(tempColor)
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: selectedColor }}
        aria-label="Alterar cor do projeto"
        aria-expanded={isOpen}
        className="mt-1 size-12 shrink-0 rounded-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
          <p className="mb-2.5 text-xs font-medium text-muted-foreground">
            Selecione uma cor
          </p>
          
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setTempColor(color)}
                style={{ backgroundColor: color }}
                className={`size-6 rounded-md transition-transform hover:scale-110 focus:outline-none ${
                  tempColor === color ? 'ring-2 ring-foreground ring-offset-2 ring-offset-popover' : ''
                }`}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2.5 border-t border-border pt-2.5">
            <input
              type="color"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              className="size-6 cursor-pointer border-0 bg-transparent p-0 rounded-md"
            />
            <span className="text-xs text-muted-foreground font-medium">Personalizado</span>
          </div>

          <div className="mt-3 flex justify-end border-t border-border pt-2.5">
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="h-7 px-3 text-xs font-medium"
            >
              <Check className="mr-1 size-3.5" />
              Confirmar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}