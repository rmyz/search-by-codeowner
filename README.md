# Search by Codeowner
This script first retrieves file paths for a given team from your `CODEOWNERS` configuration.

It then searches all files within those paths for specific text occurrences and returns a list of matching files.

## How to use
1. Copy the `search.js` file into the root of your repository.
2. The script utilizes your `.github/CODEOWNERS` file to retrieve paths associated with a specific team and consults `.gitignore` to exclude unnecessary files during the search.
3. Run the following command:
```zsh
node search.js "<text>" "<team>"
```

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
