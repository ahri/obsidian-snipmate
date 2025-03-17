# Obsidian SnipMate
> A plugin for using JavaScript snippets from a central file in your vault.

An easy way to carry around and hack on JS.

## Examples

### Math Utilities

````markdown
```snipmate
// Calculate sum of array
window.snipMate.sum = function(arr) {
  return arr.reduce((a, b) => a + b, 0);
};
```
````

### Example Usage in a DataviewJS block

````markdown
```dataviewjs
// Use the sum function
const numbers = [1, 2, 3, 4, 5];
dv.paragraph(`Sum: ${snipMate.sum(numbers)}`);
```
````
