import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils/cn';

describe('cn (classNames utility)', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes properly', () => {
    const isTrue = true;
    const isFalse = false;
    expect(cn('base', isTrue && 'active', isFalse && 'disabled')).toBe('base active');
  });

  it('resolves conflicting Tailwind classes by taking the last specified one', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles empty inputs, null, undefined gracefully', () => {
    expect(cn('', null, undefined, false)).toBe('');
  });
});
