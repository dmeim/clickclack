#!/usr/bin/env python3
"""
Script to filter out inappropriate words from word lists.
"""

import json
import re
import os
from pathlib import Path

def load_filter_words(filter_path):
    """Load filter words from JSON file."""
    with open(filter_path, 'r') as f:
        return json.load(f)

def load_word_list(word_list_path):
    """Load word list from JSON file."""
    with open(word_list_path, 'r') as f:
        return json.load(f)

def should_filter_word(word, filter_words):
    """Check if word should be filtered (case-insensitive, including plurals)."""
    word_lower = word.lower()
    
    # Check exact match
    if word_lower in filter_words:
        return True
    
    # Check plural forms
    if word_lower.endswith('s'):
        singular = word_lower[:-1]
        if singular in filter_words:
            return True
    
    # Check if singular form should be filtered (for words ending in 'y' -> 'ies')
    if word_lower.endswith('ies'):
        singular = word_lower[:-3] + 'y'
        if singular in filter_words:
            return True
    
    # Check if singular form should be filtered (for words ending in 'es')
    if word_lower.endswith('es'):
        singular = word_lower[:-2]
        if singular in filter_words:
            return True
    
    return False

def filter_word_list(word_list, filter_words):
    """Filter out inappropriate words from word list."""
    filtered_list = []
    removed_count = 0
    removed_words = []
    
    for word in word_list:
        if should_filter_word(word, filter_words):
            removed_count += 1
            removed_words.append(word)
        else:
            filtered_list.append(word)
    
    return filtered_list, removed_count, removed_words

def main():
    # Paths
    script_dir = Path(__file__).parent
    words_dir = script_dir.parent / 'words'
    filter_path = words_dir / 'filter_words.json'
    
    # Load filter words
    filter_words = load_filter_words(filter_path)
    filter_words_lower = [word.lower() for word in filter_words]
    
    print(f"Loaded {len(filter_words)} filter words")
    
    # Word list files
    word_list_files = [
        'beginner.json',
        'easy.json', 
        'medium.json',
        'hard.json',
        'expert.json'
    ]
    
    total_removed = 0
    
    # Process each word list
    for filename in word_list_files:
        word_list_path = words_dir / filename
        
        if not word_list_path.exists():
            print(f"Warning: {filename} not found, skipping")
            continue
        
        # Load word list
        word_list = load_word_list(word_list_path)
        original_count = len(word_list)
        
        # Filter word list
        filtered_list, removed_count, removed_words = filter_word_list(word_list, filter_words_lower)
        
        # Save filtered list
        with open(word_list_path, 'w') as f:
            json.dump(filtered_list, f, indent=2)
        
        total_removed += removed_count
        print(f"{filename}: {original_count} -> {len(filtered_list)} (removed {removed_count} words)")
        if removed_words:
            print(f"  Removed: {', '.join(removed_words)}")
    
    print(f"\nTotal words removed: {total_removed}")

if __name__ == "__main__":
    main()