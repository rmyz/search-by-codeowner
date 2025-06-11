# Search by Codeowner
This script first retrieves file paths for a given team from your `CODEOWNERS` configuration.

It then searches all files within those paths for specific text occurrences and returns a list of matching files.

## How to use
1. Run the command in the root folder of your repository.
```zsh
npx github:rmyz/search-by-codeowner "searchTerm" "@team/name"
```

## Requirements
- Make sure your `CODEOWNERS` file is inside `.github` folder.
- Make sure you have a `.gitignore` file.
- Make sure the team parameter exists in the `CODEOWNERS` file.

## Why
GitHub's native `CODEOWNERS` functionality is powerful for defining code ownership and automating pull request reviews. 
However, it lacks a direct way to perform a targeted search for specific text occurrences within the files owned by a particular team.

While you can see which files a team owns, or search generally across a repository, GitHub doesn't provide a built-in mechanism to:

- **Isolate the files assigned to a specific `CODEOWNERS` team.**
- **Then, search only within those team-owned files for arbitrary text strings.**
  
This gap makes it challenging for development teams to quickly:
- **Audit code related to a specific feature or component owned** by a particular team.
- **Track down usages of certain functions, variables, or patterns** that fall under a team's responsibility.
- **Perform focused refactoring efforts or impact analyses** for changes affecting a specific team's codebase.
