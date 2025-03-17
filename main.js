// This is a CommonJS module
const obsidian = require('obsidian');

// Define a global namespace for our snippets
if (!window.snipMate) {
  window.snipMate = {};
}

// Default settings
const DEFAULT_SETTINGS = {
  snipMatePath: 'SnipMate.md'
};

// Default file name constant
const DEFAULT_FILE_NAME = 'SnipMate.md';

// Main plugin class
class SnipMatePlugin extends obsidian.Plugin {
  constructor(app, manifest) {
    super(app, manifest);
    this.settings = Object.assign({}, DEFAULT_SETTINGS);
  }

  onload() {
    console.log('Loading SnipMate plugin');

    // Load settings
    this.loadSettings();

    // Add settings tab
    this.addSettingTab(new SnipMateSettingTab(this.app, this));

    // Register our custom CodeBlock renderer for snipmate blocks
    this.registerMarkdownCodeBlockProcessor('snipmate', (source, el, ctx) => {
      // Create a pre > code element for code display
      const pre = el.createEl('pre');
      const code = pre.createEl('code');
      code.setText(source);
      
      // Add a special CSS class for our styling
      pre.addClass('snipmate-codeblock');
      
      // Try to execute the snippet code
      try {
        // Execute the code directly in the global context
        const executeSnippet = new Function(source);
        executeSnippet.call(window);
        
        // Add a small success indicator
        const indicator = el.createEl('div');
        indicator.addClass('snipmate-success');
        indicator.setText('✓ Executed');
      } catch (error) {
        // Show error in the rendered block
        const errorDiv = el.createEl('div');
        errorDiv.addClass('snipmate-error');
        errorDiv.setText(`⚠️ Error: ${error.message}`);
      }
    });

    // Load snippets from the SnipMate.md file when the plugin loads
    this.app.workspace.onLayoutReady(() => {
      this.loadSnippetsFromFile();
    });
    
    // Register an event to reload snippets when the SnipMate file changes
    this.registerEvent(
      this.app.vault.on('modify', file => {
        const filePath = this.settings.snipMatePath?.trim() || DEFAULT_FILE_NAME;
        if (file.path === filePath) {
          this.loadSnippetsFromFile();
        }
      })
    );

    // Add some CSS for our code blocks
    this.addStyle();
  }

  onunload() {
    console.log('Unloading SnipMate plugin');
  }

  loadSettings() {
    this.loadData().then(data => {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    });
  }

  saveSettings() {
    return this.saveData(this.settings);
  }

  // Load snippets from the SnipMate file
  loadSnippetsFromFile() {
    // Use default path if the path is empty
    const filePath = this.settings.snipMatePath?.trim() || DEFAULT_FILE_NAME;
    const file = this.app.vault.getAbstractFileByPath(filePath);
    
    if (!file || !(file instanceof obsidian.TFile)) {
      return;
    }
    
    // Read the file contents
    this.app.vault.read(file).then((content) => {
      // Extract frontmatter for configuration using Obsidian API
      this.extractFrontmatter().then((frontmatterConfig) => {
        // Store config in the global object
        window.snipMate.config = frontmatterConfig;
        
        // Extract and evaluate all snipmate code blocks
        const codeBlocks = this.extractCodeBlocks(content);
        
        // Execute each code block from SnipMate file
        codeBlocks.forEach((block, index) => {
          try {
            // Execute in global context using Function constructor
            const executeSnippet = new Function(block);
            executeSnippet.call(window);
          } catch (error) {
            console.error(`Error executing snippet #${index + 1} from ${this.settings.snipMatePath}:`, error);
          }
        });
      }).catch((error) => {
        console.error('Error extracting frontmatter:', error);
      });
    }).catch((error) => {
      console.error('Error reading file:', error);
    });
  }

  // Get frontmatter using Obsidian API
  extractFrontmatter() {
    return new Promise((resolve) => {
      // Use default path if the path is empty
      const filePath = this.settings.snipMatePath?.trim() || DEFAULT_FILE_NAME;
      const file = this.app.vault.getAbstractFileByPath(filePath);
      
      if (!file || !(file instanceof obsidian.TFile)) {
        resolve({});
        return;
      }
      
      // Use Obsidian's API to get the frontmatter
      const cache = this.app.metadataCache.getFileCache(file);
      
      if (cache && cache.frontmatter) {
        resolve(cache.frontmatter);
      } else {
        resolve({});
      }
    });
  }

  // Extract code blocks from markdown content
  extractCodeBlocks(content) {
    const codeBlockRegex = /```snipmate\s*([\s\S]*?)\s*```/g;
    const blocks = [];
    
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match[1]) {
        blocks.push(match[1]);
      }
    }
    
    return blocks;
  }

  // Add CSS for styling the code blocks
  addStyle() {
    const style = document.createElement('style');
    style.id = 'snipmate-styles';
    style.textContent = `
      .snipmate-codeblock {
        border-left: 3px solid #4caf50;
        background-color: rgba(76, 175, 80, 0.1);
      }
      
      .snipmate-success {
        color: #4caf50;
        font-size: 0.8em;
        margin-top: 0.5em;
      }
      
      .snipmate-error {
        color: #f44336;
        font-size: 0.8em;
        margin-top: 0.5em;
        padding: 0.5em;
        background-color: rgba(244, 67, 54, 0.1);
        border-radius: 3px;
      }
    `;
    document.head.appendChild(style);
  }

  // Create example SnipMate file if it doesn't exist
  async createExampleFile() {
    // Use default path if the path is empty
    const filePath = this.settings.snipMatePath?.trim() || DEFAULT_FILE_NAME;
    
    // Check if file already exists
    const file = this.app.vault.getAbstractFileByPath(filePath);
    
    if (file) {
      // File exists, show a notice
      new obsidian.Notice(`${filePath} already exists.`);
      return false;
    }
    
    // File doesn't exist, create it
    try {
      const exampleContent = `---
---

# SnipMate Global Snippets

This file contains JavaScript snippets that will be available globally in your vault.

## Math Utilities

\`\`\`snipmate
// Calculate sum of array
window.snipMate.sum = function(arr) {
  return arr.reduce((a, b) => a + b, 0);
};
\`\`\`

## Example Usage in a DataviewJS block

\`\`\`dataviewjs
// Use the sum function
const numbers = [1, 2, 3, 4, 5];
dv.paragraph(\`Sum: \${snipMate.sum(numbers)}\`);
\`\`\`
`;

      await this.app.vault.create(filePath, exampleContent);
      new obsidian.Notice(`Created ${filePath}`);
      return true;
    } catch (error) {
      console.error('Error creating example file:', error);
      new obsidian.Notice(`Error creating ${filePath}`);
      return false;
    }
  }
}

// Settings tab
class SnipMateSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const {containerEl} = this;

    containerEl.empty();

    containerEl.createEl('h2', {text: 'SnipMate Settings'});

    new obsidian.Setting(containerEl)
      .setName('SnipMate File Path')
      .setDesc(`The path to your SnipMate file in the vault (default: ${DEFAULT_FILE_NAME})`)
      .addText(text => text
        .setPlaceholder(DEFAULT_FILE_NAME)
        .setValue(this.plugin.settings.snipMatePath)
        .onChange(async (value) => {
          // Set to empty string if value is empty 
          this.plugin.settings.snipMatePath = value.trim();
          await this.plugin.saveSettings();
          // Reload snippets from the new file
          this.plugin.loadSnippetsFromFile();
        }));
    
    new obsidian.Setting(containerEl)
      .setName('Create Example File')
      .setDesc(`Create an example SnipMate file if it doesn't exist`)
      .addButton(button => button
        .setButtonText('Create Example File')
        .onClick(async () => {
          await this.plugin.createExampleFile();
        }));
  }
}

// Export the main plugin class
module.exports = SnipMatePlugin;
