'use client'

import { useRef, forwardRef, useImperativeHandle } from "react"

export type Category = 'Not Sure' | 'Thorn' | 'Rose' | 'Seed' | 'Action'

interface CategorySelectorProps {
  selectedCategory: Category
  onCategoryChange: (category: Category) => void
  onEnter?: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

const CATEGORIES: Category[] = ['Not Sure', 'Thorn', 'Rose', 'Seed', 'Action']

const categoryDots: Record<Category, string> = {
  'Not Sure': 'bg-desk-deep',
  'Thorn': 'bg-note-yellow',
  'Rose': 'bg-note-pink',
  'Seed': 'bg-note-green',
  'Action': 'bg-note-blue',
}

const categoryLabels: Record<Category, string> = {
  'Not Sure': 'Unsorted',
  'Thorn': 'Thorn',
  'Rose': 'Rose',
  'Seed': 'Seed',
  'Action': 'Action',
}

const CategorySelector = forwardRef<{ focus: () => void }, CategorySelectorProps>(
  ({ selectedCategory, onCategoryChange, onEnter, inputRef }, ref) => {
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

    // Expose focus method to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        // Focus the button for the currently selected category
        const currentIndex = CATEGORIES.indexOf(selectedCategory)
        buttonRefs.current[currentIndex]?.focus()
      }
    }))

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()

        // Find new index
        const dir = e.key === 'ArrowLeft' ? -1 : 1
        const newIndex = (currentIndex + dir + CATEGORIES.length) % CATEGORIES.length

        buttonRefs.current[newIndex]?.focus()
        onCategoryChange(CATEGORIES[newIndex])

      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        // Move focus back to input field
        inputRef?.current?.focus()

      } else if (e.key === 'Enter') {
        e.preventDefault()
        // If onEnter callback is provided, call it (submit form)
        if (onEnter) {
          onEnter()
        } else {
          onCategoryChange(CATEGORIES[currentIndex])
        }
      } else if (e.key === ' ') {
        e.preventDefault()
        onCategoryChange(CATEGORIES[currentIndex])
      }
    }

    return (
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((category, index) => (
          <button
            key={category}
            ref={(el) => { buttonRefs.current[index] = el }}
            type="button"
            onClick={() => onCategoryChange(category)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-print text-xs font-semibold text-ink transition-all cursor-pointer
                ${
                  selectedCategory === category
                    ? 'border-ink bg-paper shadow-sm'
                    : 'border-ink/20 bg-paper/40 hover:border-ink/45'
                }
            `}
            aria-label={`Select category: ${categoryLabels[category]}`}
            aria-pressed={selectedCategory === category}
          >
            <span className={`w-2.5 h-2.5 rounded-full border border-ink/20 ${categoryDots[category]}`} />
            {categoryLabels[category]}
          </button>
        ))}
      </div>
    )
  }
)

CategorySelector.displayName = 'CategorySelector'

export default CategorySelector
