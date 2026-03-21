'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"

export type Category = 'Not Sure' | 'Thorn' | 'Rose' | 'Seed' | 'Action'

interface CategorySelectorProps {
  selectedCategory: Category
  onCategoryChange: (category: Category) => void
  onEnter?: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

const CATEGORIES: Category[] = ['Not Sure', 'Thorn', 'Rose', 'Seed', 'Action']

// Color mapping - each category gets its own color
const categoryColors: Record<Category, string> = {
  'Not Sure': 'bg-gray-100 hover:bg-gray-200 border-gray-300',
  'Thorn': 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
  'Rose': 'bg-pink-100 hover:bg-pink-200 border-pink-300',
  'Seed': 'bg-green-100 hover:bg-green-200 border-green-300',
  'Action': 'bg-blue-100 hover:bg-blue-200 border-blue-300',
  }

const CategorySelector = forwardRef<{ focus: () => void }, CategorySelectorProps>(
  ({ selectedCategory, onCategoryChange, onEnter, inputRef }, ref) => {
    const [focusedIndex, setFocusedIndex] = useState(
      CATEGORIES.indexOf(selectedCategory)
    )

    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

    // Expose focus method to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        // Focus the button for the currently selected category
        const currentIndex = CATEGORIES.indexOf(selectedCategory)
        buttonRefs.current[currentIndex]?.focus()
      }
    }))

    useEffect(() => {
      const currentIndex = CATEGORIES.indexOf(selectedCategory)
      setFocusedIndex(currentIndex)
    }, [selectedCategory])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()

        // Find new index
        const dir = e.key === 'ArrowLeft' ? -1 : 1
        const newIndex = (currentIndex + dir + CATEGORIES.length) % CATEGORIES.length
        
        setFocusedIndex(newIndex)
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
                px-4 py-2 rounded-[5px] border font-medium text-sm transition-all text-black
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${categoryColors[category]}
                ${
                  selectedCategory === category
                    ? 'ring-2 ring-blue-500 ring-offset-2 scale-105 shadow-swiftboard'
                    : 'shadow-sm'
                }
            `}
            aria-label={`Select category: ${category}`}
            aria-pressed={selectedCategory === category}
          >
            {category}
          </button>
        ))}
      </div>
    )
  }
)

CategorySelector.displayName = 'CategorySelector'

export default CategorySelector